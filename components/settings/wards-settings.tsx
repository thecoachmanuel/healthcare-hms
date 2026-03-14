import db from "@/lib/db";
import React from "react";
import SearchInput from "../search-input";
import { Table } from "../tables/table";
import { ConfirmDelete } from "../dialogs/confirm-delete";
import { AddWard, EditWard } from "../dialogs/ward-dialog";
import { deleteWard } from "@/app/actions/ward";
import { ensureDefaultDepartments, ensureDefaultWards } from "@/utils/services/catalog-seed";
import Link from "next/link";

const columns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Ward", key: "name" },
  { header: "Department", key: "department", className: "hidden md:table-cell" },
  { header: "Capacity", key: "capacity", className: "hidden md:table-cell" },
  { header: "Active", key: "active", className: "hidden md:table-cell" },
  { header: "Actions", key: "action" },
];

export const WardsSettings = async ({ q }: { q?: string }) => {
  await ensureDefaultDepartments();
  await ensureDefaultWards();
  const wards = await (async () => {
    try {
      return await db.ward.findMany({
        where: q ? { name: { contains: q, mode: "insensitive" } } : {},
        orderBy: { name: "asc" },
      });
    } catch {
      return [];
    }
  })();
  const departments = await db.department.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const departmentOptions = departments.map((d: any) => ({ label: d.name, value: d.name }));

  const renderRow = (w: any) => (
    <tr key={w.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
      <td className="hidden md:table-cell py-4">{w.id}</td>
      <td className="py-4">{w.name}</td>
      <td className="hidden md:table-cell">{w.department ?? "—"}</td>
      <td className="hidden md:table-cell">{w.capacity}</td>
      <td className="hidden md:table-cell">{w.active ? "Yes" : "No"}</td>
      <td>
        <div className="flex items-center gap-2">
          <EditWard id={w.id} name={w.name} department={w.department} capacity={w.capacity} active={w.active} departments={departmentOptions} />
          <ConfirmDelete onConfirm={async () => deleteWard(w.id) as any} />
          <Link className="text-blue-600 text-xs hover:underline" href={`/record/admissions?ward=${w.id}`}>View Admissions</Link>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Wards</h2>
          <p className="text-sm text-gray-500">Manage wards and capacities.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <AddWard departments={departmentOptions} />
        </div>
      </div>
      <Table columns={columns} data={wards as any[]} renderRow={renderRow} />
    </div>
  );
};
