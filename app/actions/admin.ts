"use server";

import db from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
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
  if (role === "LAB_RECEPTIONIST") return "lab_receptionist";
  if (role === "RECEPTIONIST") return "receptionist";
  if (role === "PHARMACIST") return "pharmacist";
  if (role === "CASHIER") return "cashier";
  return role.toLowerCase();
}

export async function createNewStaff(data: any) {
  try {
    const actorUserId = await requireAuthUserId();

    const isAdmin = await checkRole("ADMIN");

    if (!isAdmin) {
      return { success: false, msg: "Unauthorized", error: true };
    }

    const values = StaffSchema.safeParse(data);

    if (!values.success) {
      return {
        success: false,
        error: true,
        errors: true,
        msg: "Please provide all required info",
      };
    }

    const validatedValues = values.data;
    const password = validatedValues.password?.trim() ?? "";
    if (password.length < 8) {
      return {
        success: false,
        msg: "Password must be at least 8 characters",
        error: true,
      };
    }
    if (
      (validatedValues.role === "LAB_SCIENTIST" ||
        validatedValues.role === "LAB_TECHNICIAN" ||
        validatedValues.role === "LAB_RECEPTIONIST") &&
      (!validatedValues.lab_unit_id || validatedValues.lab_unit_id.trim().length === 0)
    ) {
      return { success: false, msg: "Please select a lab unit", error: true };
    }

    const [firstName, ...rest] = validatedValues.name.split(" ");
    const lastName = rest.join(" ").trim();

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: validatedValues.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      app_metadata: { role: mapRoleToRoute(validatedValues.role) },
    });

    if (error || !created.user) {
      return {
        success: false,
        msg: error?.message ?? "Failed to create user",
        error: true,
      };
    }

    await db.staff.create({
      data: {
        name: validatedValues.name,
        phone: validatedValues.phone,
        email: validatedValues.email,
        address: validatedValues.address,
        role: validatedValues.role as any,
        lab_unit_id: validatedValues.lab_unit_id ? Number(validatedValues.lab_unit_id) : null,
        ward_id: validatedValues.ward_id ? Number(validatedValues.ward_id) : null,
        license_number: validatedValues.license_number,
        department: validatedValues.department,
        img: validatedValues.img,
        colorCode: generateRandomColor(),
        id: created.user.id,
        status: "ACTIVE",
      },
    });

    await db.auditLog.create({
      data: {
        user_id: actorUserId,
        record_id: created.user.id,
        action: "CREATE",
        model: "Staff",
        details: `role=${validatedValues.role} email=${validatedValues.email}`,
      },
    });

    return {
      success: true,
      msg: "Staff added successfully",
      error: false,
    };
  } catch (error) {
    console.log(error);
    return { error: true, success: false, msg: "Something went wrong" };
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

    const wardId = (validatedValues as any).ward_id ? Number((validatedValues as any).ward_id) : null;
    delete (validatedValues as any).ward_id;

    const specName = (validatedValues.specialization ?? "").trim();
    const spec = specName
      ? await db.doctorSpecialization.findFirst({
          where: { name: { equals: specName, mode: "insensitive" }, active: true },
          select: { department: true },
        })
      : null;

    const computedDepartment = (spec?.department ?? validatedValues.department ?? "").trim() || null;

    const doctor = await db.doctor.create({
      data: {
        ...validatedValues,
        department: computedDepartment as any,
        ward_id: wardId,
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
    const isLabTechnician = await checkRole("LAB_TECHNICIAN");
    const isLabReceptionist = await checkRole("LAB_RECEPTIONIST");
    const isPharmacist = await checkRole("PHARMACIST");

    if (!isAdmin && !isLabScientist && !isLabTechnician && !isLabReceptionist && !isPharmacist) {
      return { success: false, msg: "Unauthorized", error: true };
    }

    const isValidData = ServicesSchema.safeParse(data);

    if (!isValidData.success) {
      return { success: false, msg: "Please provide all required info", error: true };
    }

    const validatedData = isValidData.data;

    const priceNumber = Number(validatedData.price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      return { success: false, msg: "Invalid price", error: true };
    }

    const requestedCategory = validatedData?.category ?? "GENERAL";
    const category = isAdmin
      ? requestedCategory
      : (isLabScientist || isLabTechnician || isLabReceptionist)
      ? "LAB_TEST"
      : "MEDICATION";

    if (
      (category === "LAB_TEST" && !(isAdmin || isLabScientist || isLabTechnician || isLabReceptionist)) ||
      (category === "MEDICATION" && !(isAdmin || isPharmacist)) ||
      (category === "GENERAL" && !isAdmin)
    ) {
      return { success: false, msg: "Unauthorized", error: true };
    }
    if (
      category === "LAB_TEST" &&
      (!validatedData?.lab_unit_id || validatedData.lab_unit_id.trim().length === 0)
    ) {
      return { success: false, msg: "Please select a lab unit" };
    }

    const createdService = await db.services.create({
      data: {
        ...validatedData!,
        category,
        price: priceNumber,
        lab_unit_id: validatedData?.lab_unit_id
          ? Number(validatedData.lab_unit_id)
          : null,
        created_by_id: userId,
        created_by_role: isAdmin
          ? "ADMIN"
          : isLabScientist
          ? "LAB_SCIENTIST"
          : isLabTechnician
          ? "LAB_TECHNICIAN"
          : isLabReceptionist
          ? "LAB_RECEPTIONIST"
          : "PHARMACIST",
        approved: isAdmin || (category === "LAB_TEST" && isLabScientist) || (category === "MEDICATION" && isPharmacist),
        approved_by_id: isAdmin || (category === "LAB_TEST" && isLabScientist) || (category === "MEDICATION" && isPharmacist) ? userId : null,
        approved_by_role: isAdmin
          ? "ADMIN"
          : (category === "LAB_TEST" && isLabScientist)
          ? "LAB_SCIENTIST"
          : (category === "MEDICATION" && isPharmacist)
          ? "PHARMACIST"
          : null,
        approved_at: isAdmin || (category === "LAB_TEST" && isLabScientist) || (category === "MEDICATION" && isPharmacist) ? new Date() : null,
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
    return { success: false, msg: "Internal Server Error", error: true };
  }
}

export async function setSiteSettings(data: {
  site_name: string;
  site_title?: string;
  logo_url?: string;
  auth_image_url?: string;
  homepage_title?: string;
  homepage_subtitle?: string;
  homepage_text?: string;
}) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const payload = {
      site_name: data.site_name.trim(),
      site_title: data.site_title?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
      auth_image_url: data.auth_image_url?.trim() || null,
      homepage_title: data.homepage_title?.trim() || null,
      homepage_subtitle: data.homepage_subtitle?.trim() || null,
      homepage_text: data.homepage_text?.trim() || null,
    };

    if (payload.site_name.length === 0) {
      return { success: false, msg: "Site name is required" };
    }

    const existing = await db.siteSettings.findFirst({ orderBy: { id: "asc" } });
    let saved: any;
    if (existing) {
      saved = await db.siteSettings.update({
        where: { id: existing.id },
        data: { ...payload, updated_by_id: userId },
      });
    } else {
      saved = await db.siteSettings.create({
        data: { ...payload, updated_by_id: userId },
      });
    }

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(saved.id),
        action: "UPDATE",
        model: "SiteSettings",
        details: `site_name=${payload.site_name}`,
      },
    });

    revalidateTag("site-settings");
    revalidatePath("/");
    revalidatePath("/admin/system-settings");

    return { success: true, msg: "Settings updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateStaff(data: any, staffId: string) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const values = StaffSchema.safeParse(data);
    if (!values.success) {
      return { success: false, msg: "Please provide all required info" };
    }

    const validatedValues = values.data;
    if (
      (validatedValues.role === "LAB_SCIENTIST" ||
        validatedValues.role === "LAB_TECHNICIAN" ||
        validatedValues.role === "LAB_RECEPTIONIST") &&
      (!validatedValues.lab_unit_id || validatedValues.lab_unit_id.trim().length === 0)
    ) {
      return { success: false, msg: "Please select a lab unit" };
    }
    const [firstName, ...rest] = validatedValues.name.split(" ");
    const lastName = rest.join(" ").trim();

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(staffId, {
      email: validatedValues.email,
      user_metadata: { first_name: firstName, last_name: lastName },
      app_metadata: { role: mapRoleToRoute(validatedValues.role) },
    });

    if (error) {
      return { success: false, msg: error.message };
    }

    await db.staff.update({
      where: { id: staffId },
      data: {
        name: validatedValues.name,
        phone: validatedValues.phone,
        email: validatedValues.email,
        address: validatedValues.address,
        role: validatedValues.role as any,
        lab_unit_id: validatedValues.lab_unit_id
          ? Number(validatedValues.lab_unit_id)
          : null,
        ward_id: validatedValues.ward_id ? Number(validatedValues.ward_id) : null,
        license_number: validatedValues.license_number,
        department: validatedValues.department,
        img: validatedValues.img,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: staffId,
        action: "UPDATE",
        model: "Staff",
        details: "Updated staff profile",
      },
    });

    return { success: true, msg: "Staff updated successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function updateDoctor(data: any, doctorId: string) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const values = DoctorSchema.safeParse(data);
    if (!values.success) {
      return { success: false, msg: "Please provide all required info" };
    }

    const validatedValues = values.data;
    const [firstName, ...rest] = validatedValues.name.split(" ");
    const lastName = rest.join(" ").trim();

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(doctorId, {
      email: validatedValues.email,
      user_metadata: { first_name: firstName, last_name: lastName },
      app_metadata: { role: "doctor" },
    });

    if (error) {
      return { success: false, msg: error.message };
    }

    const specName = (validatedValues.specialization ?? "").trim();
    const spec = specName
      ? await db.doctorSpecialization.findFirst({
          where: { name: { equals: specName, mode: "insensitive" }, active: true },
          select: { department: true },
        })
      : null;
    const computedDepartment = (spec?.department ?? validatedValues.department ?? "").trim() || null;

    await db.doctor.update({
      where: { id: doctorId },
      data: {
        name: validatedValues.name,
        phone: validatedValues.phone,
        email: validatedValues.email,
        specialization: validatedValues.specialization,
        address: validatedValues.address,
        type: validatedValues.type,
        department: computedDepartment as any,
        ward_id: validatedValues.ward_id ? Number(validatedValues.ward_id) : null,
        img: validatedValues.img,
        license_number: validatedValues.license_number,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: doctorId,
        action: "UPDATE",
        model: "Doctor",
        details: "Updated doctor profile",
      },
    });

    return { success: true, msg: "Doctor updated successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
