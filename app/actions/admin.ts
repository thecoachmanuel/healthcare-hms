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
        role: validatedValues.role,
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
    const isValidData = ServicesSchema.safeParse(data);

    const validatedData = isValidData.data;

    await db.services.create({
      data: { ...validatedData!, price: Number(data.price!) },
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
