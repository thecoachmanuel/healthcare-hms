import db from "@/lib/db";
import React from "react";
import SearchInput from "../search-input";
import { Table } from "../tables/table";
import { AddDepartment, EditDepartment } from "../dialogs/department-dialog";
import { ConfirmDelete } from "../dialogs/confirm-delete";
import { deleteDepartment } from "@/app/actions/catalog";

const columns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Department", key: "name" },
  { header: "Active", key: "active", className: "hidden md:table-cell" },
  { header: "Actions", key: "action" },
];

export const DepartmentsSettings = async ({ q }: { q?: string }) => {
  let departments: any[] = [];
  try {
    departments = await db.department.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: { name: "asc" },
    });
  } catch {
    departments = [];
  }

  const renderRow = (d: any) => (
    <tr key={d.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
      <td className="hidden md:table-cell py-4">{d.id}</td>
      <td className="py-4">{d.name}</td>
      <td className="hidden md:table-cell">{d.active ? "Yes" : "No"}</td>
      <td>
        <div className="flex items-center gap-2">
          <EditDepartment id={d.id} name={d.name} active={d.active} />
          <ConfirmDelete
            onConfirm={async () => {
              const res = await deleteDepartment(d.id);
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
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-gray-500">Manage departments used for staff assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <AddDepartment />
        </div>
      </div>
      <Table columns={columns} data={departments as any[]} renderRow={renderRow} />
    </div>
  );
};

