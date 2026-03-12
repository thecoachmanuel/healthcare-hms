import db from "@/lib/db";
import React from "react";
import { Table } from "../tables/table";
import SearchInput from "../search-input";
import { AddService } from "../dialogs/add-service";
import { SelectFilter } from "../filters/select-filter";
import { ensureDefaultLabUnits } from "@/utils/services/catalog-seed";
import { ServiceItemActions } from "@/components/settings/service-item-actions";

const baseColumns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Name", key: "name" },
  { header: "Price", key: "price", className: "hidden md:table-cell" },
  { header: "Description", key: "description", className: "hidden xl:table-cell" },
  { header: "Actions", key: "actions" },
];

export const ServiceCatalogSettings = async ({
  category,
  q,
  unitId,
}: {
  category: "GENERAL" | "LAB_TEST" | "MEDICATION";
  q?: string;
  unitId?: string;
}) => {
  try {
    await ensureDefaultLabUnits();
  } catch {}

  let units: { id: number; name: string }[] = [];
  try {
    units = await db.labUnit.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    units = [];
  }

  let data: any[] = [];
  try {
    data = await db.services.findMany({
      where: {
        category,
        ...(q
          ? {
              OR: [
                { service_name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(category === "LAB_TEST" && unitId ? { lab_unit_id: Number(unitId) } : {}),
      } as any,
      orderBy: { service_name: "asc" },
      include: { lab_unit: { select: { name: true, id: true } } },
    });
  } catch {
    data = [];
  }

  const columns =
    category === "LAB_TEST"
      ? [
          ...baseColumns.slice(0, 2),
          { header: "Unit", key: "unit", className: "hidden lg:table-cell" },
          ...baseColumns.slice(2),
        ]
      : baseColumns;

  const renderRow = (item: any) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="hidden md:table-cell py-4">{item.id}</td>
      <td className="py-4">{item.service_name}</td>
      {category === "LAB_TEST" && (
        <td className="hidden lg:table-cell">{item.lab_unit?.name ?? "—"}</td>
      )}
      <td className="hidden md:table-cell">{Number(item.price).toFixed(2)}</td>
      <td className="hidden xl:table-cell w-[50%]">
        <p className="line-clamp-1">{item.description}</p>
      </td>
      <td className="py-2">
        <ServiceItemActions
          category={category}
          item={item}
          labUnits={units.map((u: { id: number; name: string }) => ({
            label: u.name,
            value: String(u.id),
          }))}
        />
      </td>
    </tr>
  );

  const title =
    category === "GENERAL"
      ? "Services"
      : category === "LAB_TEST"
      ? "Laboratory Tests"
      : "Medications";

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">Create and manage the catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          {category === "LAB_TEST" && (
            <SelectFilter
              param="unit"
              label="Unit"
              options={[
                { label: "All", value: "" },
                ...units.map((u: { id: number; name: string }) => ({
                  label: u.name,
                  value: String(u.id),
                })),
              ]}
            />
          )}
          <AddService
            category={category}
            buttonText={
              category === "GENERAL"
                ? "Add Service"
                : category === "LAB_TEST"
                ? "Add Test"
                : "Add Medication"
            }
            title={
              category === "GENERAL"
                ? "Add Service"
                : category === "LAB_TEST"
                ? "Add Lab Test"
                : "Add Medication"
            }
            description={
              category === "LAB_TEST"
                ? "Create a lab test under a specific lab unit."
                : "Create a new item."
            }
            labUnits={units.map((u: { id: number; name: string }) => ({
              label: u.name,
              value: String(u.id),
            }))}
          />
        </div>
      </div>

      <Table columns={columns} data={data} renderRow={renderRow} />
    </div>
  );
};
