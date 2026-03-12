"use server";

import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

export async function createLabUnit(data: { name: string }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Unit name is required" };

    const created = await db.labUnit.create({ data: { name, active: true } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(created.id),
        action: "CREATE",
        model: "LabUnit",
        details: `name=${name}`,
      },
    });

    return { success: true, msg: "Lab unit created" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateLabUnit(data: { id: number; name: string; active: boolean }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Unit name is required" };

    const updated = await db.labUnit.update({
      where: { id: data.id },
      data: { name, active: data.active },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(updated.id),
        action: "UPDATE",
        model: "LabUnit",
        details: `name=${name} active=${data.active}`,
      },
    });

    return { success: true, msg: "Lab unit updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function deleteLabUnit(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const inUse = await db.services.count({ where: { lab_unit_id: id } });
    if (inUse > 0) {
      await db.labUnit.update({ where: { id }, data: { active: false } });
      return { success: true, msg: "Lab unit deactivated (in use by tests)" };
    }

    await db.labUnit.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "DELETE",
        model: "LabUnit",
        details: "Deleted lab unit",
      },
    });

    return { success: true, msg: "Lab unit deleted" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function createDoctorSpecialization(data: { name: string; department?: string }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Specialization name is required" };

    const created = await db.doctorSpecialization.create({
      data: { name, department: data.department?.trim() || null, active: true },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(created.id),
        action: "CREATE",
        model: "DoctorSpecialization",
        details: `name=${name}`,
      },
    });

    return { success: true, msg: "Specialization created" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateDoctorSpecialization(data: { id: number; name: string; department?: string; active: boolean }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Specialization name is required" };

    const updated = await db.doctorSpecialization.update({
      where: { id: data.id },
      data: { name, department: data.department?.trim() || null, active: data.active },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(updated.id),
        action: "UPDATE",
        model: "DoctorSpecialization",
        details: `name=${name} active=${data.active}`,
      },
    });

    return { success: true, msg: "Specialization updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function deleteDoctorSpecialization(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    await db.doctorSpecialization.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "DELETE",
        model: "DoctorSpecialization",
        details: "Deleted specialization",
      },
    });

    return { success: true, msg: "Specialization deleted" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateMyLabUnit(labUnitId: number) {
  try {
    const userId = await requireAuthUserId();
    const isAllowed =
      (await checkRole("LAB_SCIENTIST")) || (await checkRole("LAB_TECHNICIAN"));
    if (!isAllowed) return { success: false, msg: "Unauthorized" };

    await db.staff.update({
      where: { id: userId },
      data: { lab_unit_id: labUnitId },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(userId),
        action: "UPDATE",
        model: "Staff",
        details: `lab_unit_id=${labUnitId}`,
      },
    });

    return { success: true, msg: "Lab unit updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}
