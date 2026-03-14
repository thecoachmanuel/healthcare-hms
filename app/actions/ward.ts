"use server";

import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

export async function createWard(data: { name: string; department?: string | null; capacity?: number }) {
  const userId = await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return { success: false, msg: "Unauthorized" };

  const name = data.name.trim();
  if (!name) return { success: false, msg: "Ward name is required" };

  const created = await db.ward.create({
    data: { name, department: data.department?.trim() || null, capacity: Number(data.capacity ?? 0), active: true },
  });

  await db.auditLog.create({
    data: { user_id: userId, record_id: String(created.id), action: "CREATE", model: "Ward", details: `name=${name}` },
  });

  return { success: true, msg: "Ward created" };
}

export async function updateWard(data: { id: number; name: string; department?: string | null; capacity?: number; active: boolean }) {
  const userId = await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return { success: false, msg: "Unauthorized" };

  const name = data.name.trim();
  if (!name) return { success: false, msg: "Ward name is required" };

  const updated = await db.ward.update({
    where: { id: data.id },
    data: {
      name,
      department: data.department?.trim() || null,
      capacity: Number(data.capacity ?? 0),
      active: data.active,
    },
  });

  await db.auditLog.create({
    data: { user_id: userId, record_id: String(updated.id), action: "UPDATE", model: "Ward", details: `name=${name}` },
  });

  return { success: true, msg: "Ward updated" };
}

export async function deleteWard(id: number) {
  const userId = await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return { success: false, msg: "Unauthorized" };

  const inUse = await db.inpatientAdmission.count({ where: { ward_id: id, status: "ADMITTED" } });
  if (inUse > 0) {
    await db.ward.update({ where: { id }, data: { active: false } });
    return { success: true, msg: "Ward deactivated (patients admitted)" };
  }

  await db.ward.delete({ where: { id } });
  await db.auditLog.create({
    data: { user_id: userId, record_id: String(id), action: "DELETE", model: "Ward", details: "Deleted ward" },
  });
  return { success: true, msg: "Ward deleted" };
}

export async function admitPatient(data: { patient_id: string; ward_id: number; attending_doctor_id?: string | null }) {
  const userId = await requireAuthUserId();
  const allowed = (await checkRole("ADMIN")) || (await checkRole("NURSE")) || (await checkRole("DOCTOR"));
  if (!allowed) return { success: false, msg: "Unauthorized" };

  const active = await db.inpatientAdmission.findFirst({ where: { patient_id: data.patient_id, status: "ADMITTED" }, select: { id: true } });
  if (active) return { success: false, msg: "Patient already admitted" };

  const [staff, doctor] = await Promise.all([
    db.staff.findUnique({ where: { id: userId }, select: { role: true } }),
    db.doctor.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  const actorRole = staff?.role ?? (doctor ? "DOCTOR" : "ADMIN");

  const created = await db.inpatientAdmission.create({
    data: {
      patient_id: data.patient_id,
      ward_id: Number(data.ward_id),
      attending_doctor_id: data.attending_doctor_id ?? null,
      admitted_by_id: userId,
      admitted_by_role: actorRole,
      status: "ADMITTED",
    },
    select: { id: true },
  });

  await db.auditLog.create({ data: { user_id: userId, record_id: String(created.id), action: "CREATE", model: "InpatientAdmission", details: `ward_id=${data.ward_id}` } });

  await db.notification.createMany({
    data: [
      { user_id: data.patient_id, title: "Patient admitted", body: "You have been admitted to a ward." },
    ],
  });

  return { success: true, msg: "Patient admitted" };
}

export async function dischargePatient(data: { admission_id: number; notes?: string | null }) {
  const userId = await requireAuthUserId();
  const allowed = (await checkRole("ADMIN")) || (await checkRole("DOCTOR"));
  if (!allowed) return { success: false, msg: "Unauthorized" };

  const admission = await db.inpatientAdmission.findUnique({ where: { id: data.admission_id }, select: { id: true, patient_id: true, status: true } });
  if (!admission) return { success: false, msg: "Admission not found" };
  if (admission.status !== "ADMITTED") return { success: false, msg: "Not currently admitted" };

  const [staff, doctor] = await Promise.all([
    db.staff.findUnique({ where: { id: userId }, select: { role: true, name: true } }),
    db.doctor.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
  ]);
  const isDoctor = !!doctor;
  const actorRole = isDoctor ? "DOCTOR" : "ADMIN";
  const actorName = isDoctor ? (doctor?.name || "Doctor") : (staff?.name || "Admin");

  await db.inpatientAdmission.update({
    where: { id: admission.id },
    data: { status: "DISCHARGED", discharged_at: new Date(), discharge_notes: data.notes?.trim() || null, discharged_by_id: userId, discharged_by_role: actorRole, discharged_by_name: actorName },
  });

  await db.auditLog.create({ data: { user_id: userId, record_id: String(admission.id), action: "UPDATE", model: "InpatientAdmission", details: `status=DISCHARGED; by=${actorName}` } });

  await db.notification.createMany({
    data: [
      { user_id: admission.patient_id, title: "Discharge", body: `You have been discharged by ${actorName}.` },
    ],
  });

  return { success: true, msg: "Patient discharged" };
}
