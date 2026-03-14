"use server";

import db from "@/lib/db";
import { PatientFormSchema, PatientUpdateSchema } from "@/lib/schema";
import { requireAuthUserId } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRole } from "@/utils/roles";
import { Prisma } from "@prisma/client";

function digitsOnly(value: unknown) {
  if (typeof value !== "string") return value;
  return value.replace(/\D/g, "");
}

function normalizePatientPayload(input: any) {
  const gender =
    typeof input?.gender === "string" ? input.gender.toUpperCase() : input?.gender;
  const marital_status =
    typeof input?.marital_status === "string"
      ? input.marital_status.toLowerCase()
      : input?.marital_status;
  const relationRaw =
    typeof input?.relation === "string" ? input.relation.toLowerCase() : input?.relation;
  const relation =
    relationRaw === "mother" ||
    relationRaw === "father" ||
    relationRaw === "husband" ||
    relationRaw === "wife" ||
    relationRaw === "other"
      ? relationRaw
      : relationRaw
      ? "other"
      : relationRaw;
  const hospital_number =
    typeof input?.hospital_number === "string"
      ? input.hospital_number.trim().toUpperCase()
      : input?.hospital_number;

  return {
    ...input,
    gender,
    marital_status,
    relation,
    phone: digitsOnly(input?.phone),
    emergency_contact_number: digitsOnly(input?.emergency_contact_number),
    hospital_number,
  };
}

async function generateHospitalNumber(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${d}`;
  const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HN-${datePart}-${rand()}`;
}

export async function updatePatient(data: any, pid: string) {
  try {
    const userId = await requireAuthUserId();
    if (pid !== userId) {
      return { success: false, error: true, msg: "Unauthorized" };
    }

    const validateData = PatientUpdateSchema.safeParse(normalizePatientPayload(data));

    if (!validateData.success) {
      return {
        success: false,
        error: true,
        msg: "Provide all required fields",
      };
    }

    const patientData = validateData.data;

    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: { first_name: patientData.first_name, last_name: patientData.last_name },
    });

    await db.patient.update({
      data: {
        ...patientData,
      },
      where: { id: pid },
    });

    return {
      success: true,
      error: false,
      msg: "Patient info updated successfully",
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
export async function createNewPatient(data: any, pid: string) {
  try {
    const validateData = PatientFormSchema.safeParse(normalizePatientPayload(data));

    if (!validateData.success) {
      return {
        success: false,
        error: true,
        msg: "Provide all required fields",
      };
    }

    const patientData = validateData.data;
    let patient_id = pid;
    let createdById: string | null = null;

    if (pid === "new-patient") {
      createdById = await requireAuthUserId();
      const isAllowed =
        (await checkRole("ADMIN")) || (await checkRole("RECORD_OFFICER"));
      if (!isAllowed) {
        return { success: false, error: true, msg: "Unauthorized" };
      }

      const supabaseAdmin = createSupabaseAdminClient();
      const password =
        patientData.phone.length >= 8 ? patientData.phone : patientData.phone.padEnd(8, "0");

      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: patientData.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: patientData.first_name,
          last_name: patientData.last_name,
        },
        app_metadata: { role: "patient" },
      });

      if (error || !created.user) {
        return { success: false, error: true, msg: error?.message ?? "Failed to create user" };
      }

      patient_id = created.user.id;
    } else {
      const userId = await requireAuthUserId();
      if (pid !== userId) {
        return { success: false, error: true, msg: "Unauthorized" };
      }
    }

    const email = typeof patientData.email === "string" ? patientData.email.toLowerCase() : patientData.email;

    let hospitalNumber = patientData.hospital_number && patientData.hospital_number.length > 0
      ? patientData.hospital_number.toUpperCase()
      : await generateHospitalNumber();

    let created;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        created = await db.patient.create({
          data: {
            ...patientData,
            email,
            id: patient_id,
            hospital_number: hospitalNumber,
          },
        });
        break;
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          if ((e.meta as any)?.target?.includes("hospital_number")) {
            hospitalNumber = await generateHospitalNumber();
            continue;
          }
          if ((e.meta as any)?.target?.includes("email")) {
            return { success: false, error: true, msg: "Email already exists. Use a different email." };
          }
        }
        throw e;
      }
    }
    if (!created) {
      return { success: false, error: true, msg: "Failed to create patient. Please try again." };
    }

    await db.auditLog.create({
      data: {
        user_id: createdById ?? patient_id,
        record_id: created.id,
        action: "CREATE",
        model: "Patient",
        details: `hospital_number=${created.hospital_number ?? ""}`,
      },
    });

    return { success: true, error: false, msg: "Patient created successfully" };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message ?? "An unexpected error occurred" };
  }
}

export async function adminUpdatePatient(data: any, pid: string) {
  try {
    const userId = await requireAuthUserId();
    const [isAdmin, isRecordOfficer] = await Promise.all([
      checkRole("ADMIN"),
      checkRole("RECORD_OFFICER"),
    ]);
    const isAllowed = isAdmin || isRecordOfficer;
    if (!isAllowed) {
      return { success: false, error: true, msg: "Unauthorized" };
    }

    const validateData = PatientUpdateSchema.safeParse(normalizePatientPayload(data));
    if (!validateData.success) {
      return { success: false, error: true, msg: "Provide all required fields" };
    }

    const patientData = validateData.data;

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(pid, {
      email: patientData.email,
      user_metadata: { first_name: patientData.first_name, last_name: patientData.last_name },
      app_metadata: { role: "patient" },
    });
    if (error) {
      return { success: false, error: true, msg: error.message };
    }

    const updated = await db.patient.update({
      data: { ...patientData },
      where: { id: pid },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: pid,
        action: "UPDATE",
        model: "Patient",
        details: `Updated patient profile hospital_number=${updated.hospital_number ?? ""}`,
      },
    });

    return { success: true, error: false, msg: "Patient updated successfully" };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
