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

export async function createDepartment(data: { name: string }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Department name is required" };

    const created = await db.department.create({ data: { name, active: true } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(created.id),
        action: "CREATE",
        model: "Department",
        details: `name=${name}`,
      },
    });

    return { success: true, msg: "Department created" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateDepartment(data: { id: number; name: string; active: boolean }) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.name.trim();
    if (!name) return { success: false, msg: "Department name is required" };

    const updated = await db.department.update({
      where: { id: data.id },
      data: { name, active: data.active },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(updated.id),
        action: "UPDATE",
        model: "Department",
        details: `name=${name} active=${data.active}`,
      },
    });

    return { success: true, msg: "Department updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function deleteDepartment(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const dept = await db.department.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!dept) return { success: false, msg: "Department not found" };

    const [staffCount, doctorCount] = await Promise.all([
      db.staff.count({ where: { department: { equals: dept.name, mode: "insensitive" } } }),
      db.doctor.count({ where: { department: { equals: dept.name, mode: "insensitive" } } }),
    ]);
    if (staffCount > 0 || doctorCount > 0) {
      await db.department.update({ where: { id }, data: { active: false } });
      return { success: true, msg: "Department deactivated (in use)" };
    }

    await db.department.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "DELETE",
        model: "Department",
        details: "Deleted department",
      },
    });

    return { success: true, msg: "Department deleted" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateMyLabUnit(labUnitId: number) {
  try {
    const userId = await requireAuthUserId();
    const isAllowed =
      (await checkRole("LAB_SCIENTIST" as any)) ||
      (await checkRole("LAB_TECHNICIAN" as any)) ||
      (await checkRole("LAB_RECEPTIONIST" as any));
    if (!isAllowed) return { success: false, msg: "Unauthorized" };

    const me = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
    if (me?.lab_unit_id) {
      return { success: false, msg: "Lab unit already set. Contact admin to change." };
    }

    await db.staff.update({ where: { id: userId }, data: { lab_unit_id: labUnitId } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(userId),
        action: "UPDATE",
        model: "Staff",
        details: `lab_unit_id=${labUnitId}`,
      },
    });

    return { success: true, msg: "Lab unit set successfully" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function updateServiceCatalogItem(data: {
  id: number;
  service_name: string;
  price: number;
  description: string;
  category: "GENERAL" | "LAB_TEST" | "MEDICATION";
  lab_unit_id?: number | null;
}) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const name = data.service_name.trim();
    if (!name) return { success: false, msg: "Name is required" };

    if (data.category === "LAB_TEST" && !data.lab_unit_id) {
      return { success: false, msg: "Lab unit is required for lab tests" };
    }

    const updated = await db.services.update({
      where: { id: data.id },
      data: {
        service_name: name,
        price: Number(data.price),
        description: data.description,
        category: data.category as any,
        lab_unit_id: data.category === "LAB_TEST" ? data.lab_unit_id : null,
      } as any,
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(updated.id),
        action: "UPDATE",
        model: "Services",
        details: `service_name=${name} category=${data.category}`,
      },
    });

    return { success: true, msg: "Item updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function deleteServiceCatalogItem(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    if (!isAdmin) return { success: false, msg: "Unauthorized" };

    const [billCount, labCount, rxCount] = await Promise.all([
      db.patientBills.count({ where: { service_id: id } }),
      db.labTest.count({ where: { service_id: id } }),
      db.prescriptionItem.count({ where: { medication_id: id } }),
    ]);
    if (billCount > 0 || labCount > 0 || rxCount > 0) {
      return { success: false, msg: "Cannot delete: item is in use" };
    }

    await db.services.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "DELETE",
        model: "Services",
        details: "Deleted item",
      },
    });

    return { success: true, msg: "Item deleted" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}
