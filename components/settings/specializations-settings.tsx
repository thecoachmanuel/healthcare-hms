import db from "@/lib/db";
import React from "react";
import SearchInput from "../search-input";
import { Table } from "../tables/table";
import { AddSpecialization, EditSpecialization } from "../dialogs/specialization-dialog";
import { ConfirmDelete } from "../dialogs/confirm-delete";
import { deleteDoctorSpecialization } from "@/app/actions/catalog";
import { ensureDefaultDepartments, ensureDefaultDoctorSpecializations } from "@/utils/services/catalog-seed";

const columns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Name", key: "name" },
  { header: "Department", key: "department", className: "hidden md:table-cell" },
  { header: "Active", key: "active", className: "hidden md:table-cell" },
  { header: "Actions", key: "action" },
];

export const SpecializationsSettings = async ({ q }: { q?: string }) => {
  try {
    await ensureDefaultDoctorSpecializations();
  } catch {}
  try {
    await ensureDefaultDepartments();
  } catch {}

  let departments: { label: string; value: string }[] = [];
  try {
    const departmentsDb = await db.department.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    departments = departmentsDb.map((d: { name: string }) => ({ label: d.name, value: d.name }));
  } catch {
    departments = [];
  }
  let specs: any[] = [];
  try {
    specs = await db.doctorSpecialization.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
    });
  } catch {
    specs = [];
  }

  const renderRow = (s: any) => (
    <tr
      key={s.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="hidden md:table-cell py-4">{s.id}</td>
      <td className="py-4">{s.name}</td>
      <td className="hidden md:table-cell">{s.department ?? "—"}</td>
      <td className="hidden md:table-cell">{s.active ? "Yes" : "No"}</td>
      <td>
        <div className="flex items-center gap-2">
          <EditSpecialization id={s.id} name={s.name} department={s.department} active={s.active} departments={departments} />
          <ConfirmDelete
            onConfirm={async () => {
              const res = await deleteDoctorSpecialization(s.id);
              return { success: res.success, msg: res.msg };
            }}
          />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Doctor Specializations</h2>
          <p className="text-sm text-gray-500">Manage selectable specializations for doctor onboarding.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <AddSpecialization departments={departments} />
        </div>
      </div>
      <Table columns={columns} data={specs as any[]} renderRow={renderRow} />
    </div>
  );
};
