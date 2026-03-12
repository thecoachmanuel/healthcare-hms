import { EditDoctorForm } from "@/components/forms/edit-doctor-form";
import { Card } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import React from "react";
import { ensureDefaultDepartments, ensureDefaultDoctorSpecializations } from "@/utils/services/catalog-seed";

const EditDoctorPage = async (props: { params: Promise<{ id: string }> }) => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return null;

  const params = await props.params;
  const doctor = await db.doctor.findUnique({ where: { id: params.id } });
  if (!doctor) return null;
  await ensureDefaultDoctorSpecializations();
  await ensureDefaultDepartments();
  const specializationsDb = await db.doctorSpecialization.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { name: true, department: true },
  });
  const departmentsDb = await db.department.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const specializations =
    specializationsDb.length > 0
      ? specializationsDb.map((s: { name: string; department: string | null }) => ({
          label: s.name,
          value: s.name,
          department: s.department ?? "General",
        }))
      : [];
  const departments =
    departmentsDb.length > 0
      ? departmentsDb.map((d: { name: string }) => ({ label: d.name, value: d.name }))
      : [];

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl p-6">
        <h1 className="text-xl font-semibold">Edit Doctor</h1>
        <EditDoctorForm
          doctor={doctor}
          specializations={specializations as any}
          departments={departments}
        />
      </Card>
    </div>
  );
};

export default EditDoctorPage;
