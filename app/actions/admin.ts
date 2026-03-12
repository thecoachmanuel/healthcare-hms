"use server";

import db from "@/lib/db";
import {
  DoctorSchema,
  ServicesSchema,
  StaffSchema,
  WorkingDaysSchema,
} from "@/lib/schema";
import { generateRandomColor } from "@/utils";
import { checkRole } from "@/utils/roles";
import { requireAuthUserId } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRoleToRoute(role: string) {
  if (role === "LAB_SCIENTIST") return "lab_scientist";
  if (role === "LAB_TECHNICIAN") return "lab_technician";
  if (role === "PHARMACIST") return "pharmacist";
  if (role === "CASHIER") return "cashier";
  return role.toLowerCase();
}

export async function createNewStaff(data: any) {
  try {
    await requireAuthUserId();

    const isAdmin = await checkRole("ADMIN");

    if (!isAdmin) {
      return { success: false, msg: "Unauthorized" };
    }

    const values = StaffSchema.safeParse(data);

    if (!values.success) {
      return {
        success: false,
        errors: true,
        message: "Please provide all required info",
      };
    }

    const validatedValues = values.data;

    const [firstName, ...rest] = validatedValues.name.split(" ");
    const lastName = rest.join(" ").trim();

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: validatedValues.email,
      password: validatedValues.password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      app_metadata: { role: mapRoleToRoute(validatedValues.role) },
    });

    if (error || !created.user) {
      return { success: false, msg: error?.message ?? "Failed to create user" };
    }

    delete validatedValues["password"];

    const doctor = await db.staff.create({
      data: {
        name: validatedValues.name,
        phone: validatedValues.phone,
        email: validatedValues.email,
        address: validatedValues.address,
        role: validatedValues.role as any,
        license_number: validatedValues.license_number,
        department: validatedValues.department,
        colorCode: generateRandomColor(),
        id: created.user.id,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      message: "Doctor added successfully",
      error: false,
    };
  } catch (error) {
    console.log(error);
    return { error: true, success: false, message: "Something went wrong" };
  }
}
export async function createNewDoctor(data: any) {
  try {
    await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) {
      return { success: false, message: "Unauthorized", error: true };
    }

    const values = DoctorSchema.safeParse(data);

    const workingDaysValues = WorkingDaysSchema.safeParse(data?.work_schedule);

    if (!values.success || !workingDaysValues.success) {
      return {
        success: false,
        errors: true,
        message: "Please provide all required info",
      };
    }

    const validatedValues = values.data;
    const workingDayData = workingDaysValues.data!;

    const [firstName, ...rest] = validatedValues.name.split(" ");
    const lastName = rest.join(" ").trim();

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: validatedValues.email,
      password: validatedValues.password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      app_metadata: { role: "doctor" },
    });

    if (error || !created.user) {
      return { success: false, message: error?.message ?? "Failed to create user", error: true };
    }

    delete validatedValues["password"];

    const doctor = await db.doctor.create({
      data: {
        ...validatedValues,
        id: created.user.id,
      },
    });

    await Promise.all(
      workingDayData?.map((el) =>
        db.workingDays.create({
          data: { ...el, doctor_id: doctor.id },
        })
      )
    );

    return {
      success: true,
      message: "Doctor added successfully",
      error: false,
    };
  } catch (error) {
    console.log(error);
    return { error: true, success: false, message: "Something went wrong" };
  }
}

export async function addNewService(data: any) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    const isLabScientist = await checkRole("LAB_SCIENTIST");
    const isPharmacist = await checkRole("PHARMACIST");

    if (!isAdmin && !isLabScientist && !isPharmacist) {
      return { success: false, msg: "Unauthorized" };
    }

    const isValidData = ServicesSchema.safeParse(data);

    const validatedData = isValidData.data;

    const requestedCategory = validatedData?.category ?? "GENERAL";
    const category = isAdmin
      ? requestedCategory
      : isLabScientist
      ? "LAB_TEST"
      : "MEDICATION";

    if (
      (category === "LAB_TEST" && !(isAdmin || isLabScientist)) ||
      (category === "MEDICATION" && !(isAdmin || isPharmacist)) ||
      (category === "GENERAL" && !isAdmin)
    ) {
      return { success: false, msg: "Unauthorized" };
    }

    const createdService = await db.services.create({
      data: {
        ...validatedData!,
        category,
        price: Number(data.price!),
        created_by_id: userId,
        created_by_role: isAdmin
          ? "ADMIN"
          : isLabScientist
          ? "LAB_SCIENTIST"
          : "PHARMACIST",
      },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(createdService.id),
        action: "CREATE",
        model: "Services",
        details: `category=${category} service_name=${validatedData?.service_name}`,
      },
    });

    return {
      success: true,
      error: false,
      msg: `Service added successfully`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
