import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import React from "react";

const columns = [
  { header: "Patient", key: "patient" },
  { header: "Receipt", key: "receipt", className: "hidden lg:table-cell" },
  { header: "Total", key: "total", className: "hidden md:table-cell" },
  { header: "Paid", key: "paid", className: "hidden md:table-cell" },
  { header: "Outstanding", key: "outstanding", className: "hidden md:table-cell" },
  { header: "Status", key: "status" },
  { header: "Date", key: "date", className: "hidden lg:table-cell" },
];

function computeOutstanding(p: any) {
  const total = Number(p.total_amount || 0);
  const paid = Number(p.amount_paid || 0);
  return Math.max(0, Number((total - paid).toFixed(2)));
}

const AdminPaymentsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return null;

  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || ""; // PAID | PART | OWING (derived) | UNPAID
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  // Base filter by patient name or hospital number
  const patientFilter = q
    ? ({
        OR: [
          { patient: { first_name: { contains: q, mode: "insensitive" } } },
          { patient: { last_name: { contains: q, mode: "insensitive" } } },
          { patient: { hospital_number: { contains: q, mode: "insensitive" } } },
        ],
      } as any)
    : {};

  const baseWhere: any = { AND: [patientFilter] };

  if (status === "PAID") baseWhere.AND.push({ status: "PAID" });
  else if (status === "PART") baseWhere.AND.push({ status: "PART" });
  else if (status === "UNPAID") baseWhere.AND.push({ status: "UNPAID" });
  // OWING is a derived bucket: UNPAID or PART with outstanding > 0. We'll filter in-memory for the outstanding amount after fetch.

  const [rowsRaw, counts] = await Promise.all([
    db.payment.findMany({
      include: {
        patient: { select: { first_name: true, last_name: true, hospital_number: true } },
        appointment: { select: { id: true, appointment_date: true } },
      },
      where: baseWhere,
      orderBy: { created_at: "desc" as any },
      skip,
      take: limit,
    }),
    Promise.all([
      db.payment.count({ where: {} }),
      db.payment.count({ where: { status: "PAID" as any } }),
      db.payment.count({ where: { status: "PART" as any } }),
      db.payment.count({ where: { status: "UNPAID" as any } }),
    ]),
  ]);

  let rows = rowsRaw;
  if (status === "OWING") {
    rows = rowsRaw.filter((p: any) => p.status === "UNPAID" || computeOutstanding(p) > 0);
  }

  const [totalCount, paidCount, partCount, unpaidCount] = counts as number[];

  const renderRow = (p: any) => {
    const patient = p.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();
    const outstanding = computeOutstanding(p);
    const statusLabel = p.status === "PAID" && outstanding === 0 ? "PAID" : p.status === "PART" && outstanding > 0 ? "PART" : p.status;

    return (
      <tr key={p.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td>
          <div className="flex flex-col">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{patient.hospital_number ?? "-"}</div>
          </div>
        </td>
        <td className="hidden lg:table-cell">#{p.receipt_number}</td>
        <td className="hidden md:table-cell">₦{Number(p.total_amount || 0).toLocaleString()}</td>
        <td className="hidden md:table-cell">₦{Number(p.amount_paid || 0).toLocaleString()}</td>
        <td className="hidden md:table-cell">₦{outstanding.toLocaleString()}</td>
        <td>
          <span className="px-2 py-0.5 rounded text-xs border">
            {statusLabel}
          </span>
        </td>
        <td className="hidden lg:table-cell">{format(p.payment_date, "yyyy-MM-dd")}</td>
      </tr>
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm px-2 py-1 border rounded-md bg-slate-50">Total: {totalCount}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Paid: {paidCount}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Part: {partCount}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Unpaid: {unpaidCount}</div>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <SelectFilter
            param="status"
            label="Status"
            options={[
              { label: "All", value: "" },
              { label: "Paid", value: "PAID" },
              { label: "Part Paid", value: "PART" },
              { label: "Unpaid", value: "UNPAID" },
              { label: "Owing (Derived)", value: "OWING" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={rows as any[]} renderRow={renderRow} />
        <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalCount} limit={DATA_LIMIT} />
      </div>
    </div>
  );
};

export default AdminPaymentsPage;

