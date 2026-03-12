import db from "@/lib/db";
import React from "react";
import SearchInput from "../search-input";
import { Table } from "../tables/table";
import { AddLabUnit, EditLabUnit } from "../dialogs/lab-unit-dialog";
import { ConfirmDelete } from "../dialogs/confirm-delete";
import { ensureDefaultLabUnits } from "@/utils/services/catalog-seed";

const columns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Unit", key: "name" },
  { header: "Active", key: "active", className: "hidden md:table-cell" },
  { header: "Actions", key: "action" },
];

export const LabUnitsSettings = async ({ q }: { q?: string }) => {
  try {
    await ensureDefaultLabUnits();
  } catch {}

  let units: any[] = [];
  try {
    units = await db.labUnit.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
    });
  } catch {
    units = [];
  }

  const renderRow = (u: any) => (
    <tr
      key={u.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="hidden md:table-cell py-4">{u.id}</td>
      <td className="py-4">{u.name}</td>
      <td className="hidden md:table-cell">{u.active ? "Yes" : "No"}</td>
      <td>
        <div className="flex items-center gap-2">
          <EditLabUnit id={u.id} name={u.name} active={u.active} />
          <ConfirmDelete
            deleteAction={{ type: "labUnit", id: u.id }}
          />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Lab Units</h2>
          <p className="text-sm text-gray-500">Manage units used to group lab tests.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <AddLabUnit />
        </div>
      </div>
      <Table columns={columns} data={units as any[]} renderRow={renderRow} />
    </div>
  );
};
