import { AddMedication } from "@/components/dialogs/add-medication";
import { Table } from "@/components/tables/table";
import { Card } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { Services } from "@prisma/client";
import Link from "next/link";
import React from "react";

const columns = [
  { header: "ID", key: "id", className: "hidden md:table-cell" },
  { header: "Medication", key: "name" },
  { header: "Price", key: "price", className: "hidden md:table-cell" },
  { header: "Description", key: "description", className: "hidden xl:table-cell" },
];

const MedicationsPage = async () => {
  await requireAuthUserId();
  const isAllowed = (await checkRole("ADMIN" as any)) || (await checkRole("PHARMACIST" as any));
  if (!isAllowed) return null;

  const data = await db.services.findMany({
    where: { category: "MEDICATION" } as any,
    orderBy: { service_name: "asc" },
  });

  const renderRow = (item: Services) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="hidden md:table-cell py-4">{item.id}</td>
      <td className="py-4">
        <Link className="text-blue-600 hover:underline" href={`/medications/${item.id}`}>
          {item.service_name}
        </Link>
      </td>
      <td className="hidden md:table-cell">{item.price.toFixed(2)}</td>
      <td className="hidden xl:table-cell w-[50%]">
        <p className="line-clamp-1">{item.description}</p>
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Medications</h1>
            <p className="text-sm text-gray-500">Global medications and pricing.</p>
          </div>
          <AddMedication />
        </div>
        <Table columns={columns} data={data} renderRow={renderRow} />
      </Card>
    </div>
  );
};

export default MedicationsPage;
