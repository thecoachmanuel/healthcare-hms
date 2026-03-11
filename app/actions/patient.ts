"use server";

import db from "@/lib/db";
import { PatientFormSchema, PatientUpdateSchema } from "@/lib/schema";
import { requireAuthUserId } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return {
    ...input,
    gender,
    marital_status,
    relation,
    phone: digitsOnly(input?.phone),
    emergency_contact_number: digitsOnly(input?.emergency_contact_number),
  };
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

    if (pid === "new-patient") {
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

    await db.patient.create({
      data: {
        ...patientData,
        id: patient_id,
      },
    });

    return { success: true, error: false, msg: "Patient created successfully" };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
