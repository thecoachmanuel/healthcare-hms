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

export async function approveLabTestService(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    const isLabScientist = await checkRole("LAB_SCIENTIST" as any);

    const service = await db.services.findUnique({
      where: { id },
      select: {
        id: true,
        category: true,
        lab_unit_id: true,
        approved: true,
        created_by_role: true,
      },
    });
    if (!service || service.category !== ("LAB_TEST" as any)) {
      return { success: false, msg: "Item not found" };
    }
    if (service.approved) return { success: true, msg: "Already approved" };

    if (!isAdmin && !isLabScientist) {
      return { success: false, msg: "Unauthorized" };
    }

    if (isLabScientist && !isAdmin) {
      const me = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
      const sameUnit = me?.lab_unit_id && service.lab_unit_id && me.lab_unit_id === service.lab_unit_id;
      const createdByAllowed = service.created_by_role === ("LAB_RECEPTIONIST" as any) || service.created_by_role === ("LAB_TECHNICIAN" as any);
      if (!sameUnit || !createdByAllowed) {
        return { success: false, msg: "Not permitted to approve this item" };
      }
    }

    const updated = await db.services.update({
      where: { id },
      data: {
        approved: true,
        approved_by_id: userId,
        approved_by_role: isAdmin ? ("ADMIN" as any) : ("LAB_SCIENTIST" as any),
        approved_at: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(updated.id),
        action: "UPDATE",
        model: "Services",
        details: `approved=true category=LAB_TEST`,
      },
    });

    return { success: true, msg: "Approved" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function approveLabTestServicesBulk(ids: number[]) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    const isLabScientist = await checkRole("LAB_SCIENTIST" as any);

    if (!isAdmin && !isLabScientist) return { success: false, msg: "Unauthorized" };

    const services = await db.services.findMany({
      where: { id: { in: ids }, category: "LAB_TEST" as any, approved: false },
      select: { id: true, lab_unit_id: true, created_by_role: true },
    });

    if (services.length === 0) return { success: true, msg: "No pending items" };

    if (isLabScientist && !isAdmin) {
      const me = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
      const allowedIds = new Set(
        services
          .filter(
            (s: any) =>
              s.lab_unit_id && me?.lab_unit_id === s.lab_unit_id &&
              (s.created_by_role === ("LAB_RECEPTIONIST" as any) || s.created_by_role === ("LAB_TECHNICIAN" as any))
          )
          .map((s: any) => s.id)
      );
      ids = ids.filter((id) => allowedIds.has(id));
      if (ids.length === 0) return { success: false, msg: "No permitted items to approve" };
    }

    await db.services.updateMany({
      where: { id: { in: ids } },
      data: {
        approved: true,
        approved_by_id: userId,
        approved_by_role: isAdmin ? ("ADMIN" as any) : ("LAB_SCIENTIST" as any),
        approved_at: new Date(),
      },
    });

    return { success: true, msg: "Approved selected" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function bulkApproveLabTests(formData: FormData) {
  "use server";
  const raw = formData.get("ids");
  const ids = Array.isArray(raw)
    ? (raw as any[]).map((v) => Number(v))
    : JSON.parse(String(raw || "[]"));
  return approveLabTestServicesBulk(ids as number[]);
}

export async function deletePendingLabTest(id: number) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    const isLabScientist = await checkRole("LAB_SCIENTIST" as any);

    const service = await db.services.findUnique({
      where: { id },
      select: { id: true, approved: true, category: true, lab_unit_id: true, created_by_id: true, created_by_role: true },
    });
    if (!service || service.category !== ("LAB_TEST" as any)) return { success: false, msg: "Item not found" };
    if (service.approved) return { success: false, msg: "Cannot delete an approved item" };

    if (!isAdmin && !isLabScientist) return { success: false, msg: "Unauthorized" };
    
    // Allow scientists and admin to delete tests created by technicians and receptionists
    if (isLabScientist && !isAdmin) {
      const me = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
      if (!me?.lab_unit_id || me.lab_unit_id !== service.lab_unit_id) {
        return { success: false, msg: "Not permitted to delete this item" };
      }
    }

    // Check for dependent records before deletion
    const [billCount, labTestCount] = await Promise.all([
      db.patientBills.count({ where: { service_id: id } }),
      db.labTest.count({ where: { service_id: id } }),
    ]);

    if (billCount > 0) {
      return { success: false, msg: "Cannot delete: item has associated billing records" };
    }
    if (labTestCount > 0) {
      return { success: false, msg: "Cannot delete: item has associated lab tests" };
    }

    await db.services.delete({ where: { id } });
    
    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "DELETE",
        model: "Services",
        details: "Deleted lab test service",
      },
    });

    return { success: true, msg: "Deleted" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}

export async function bulkDeletePendingLabTests(formData: FormData) {
  "use server";
  const ids = JSON.parse(String(formData.get("ids") || "[]")) as number[];
  const results = [] as any[];
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await deletePendingLabTest(id));
  }
  const ok = results.filter((r) => r.success).length;
  return { success: ok > 0, msg: ok > 0 ? "Deleted selected" : (results[0]?.msg || "Failed") };
}

export async function updateLabTestCatalogItem(data: {
  id: number;
  service_name: string;
  price: number;
  description: string;
  lab_unit_id: number;
}) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    const isLabScientist = await checkRole("LAB_SCIENTIST" as any);

    const service = await db.services.findUnique({
      where: { id: data.id },
      select: { id: true, category: true, approved: true, lab_unit_id: true },
    });
    if (!service || service.category !== ("LAB_TEST" as any)) return { success: false, msg: "Item not found" };

    if (!isAdmin && !isLabScientist) return { success: false, msg: "Unauthorized" };
    if (isLabScientist && !isAdmin) {
      if (service.approved) return { success: false, msg: "Cannot edit approved item" };
      const me = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
      if (!me?.lab_unit_id || me.lab_unit_id !== service.lab_unit_id) {
        return { success: false, msg: "Not permitted to edit this item" };
      }
    }

    const name = data.service_name.trim();
    if (!name) return { success: false, msg: "Name is required" };

    const dup = await db.services.findFirst({
      where: {
        id: { not: data.id },
        category: "LAB_TEST" as any,
        lab_unit_id: Number(data.lab_unit_id),
        service_name: { equals: name, mode: "insensitive" },
      } as any,
      select: { id: true },
    });
    if (dup) return { success: false, msg: "Duplicate test exists for this unit" };

    await db.services.update({
      where: { id: data.id },
      data: {
        service_name: name,
        price: Number(data.price),
        description: data.description,
        lab_unit_id: Number(data.lab_unit_id),
      },
    });

    return { success: true, msg: "Updated" };
  } catch (error: any) {
    return { success: false, msg: error?.message ?? "Internal Server Error" };
  }
}
