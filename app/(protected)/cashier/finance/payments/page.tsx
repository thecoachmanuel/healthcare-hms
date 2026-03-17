import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { PaymentStatusDistributionChart, ReceivablesOverTimeChart } from "@/components/charts/admin-reports";
import { ExportCsvButton } from "@/components/export-csv-button";
import { formatCurrency } from "@/lib/csv-export";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import React from "react";

type Stat = {
  status: "PAID" | "PART" | "UNPAID";
  _count: { status: number };
  _sum: { total_amount: number | null; amount_paid: number | null; discount: number | null };
};

const columns = [
  { header: "S/N", key: "sn" },
  { header: "Patient", key: "patient" },
  { header: "Receipt", key: "receipt", className: "hidden lg:table-cell" },
  { header: "Total", key: "total", className: "hidden md:table-cell" },
  { header: "Paid", key: "paid", className: "hidden md:table-cell" },
  { header: "Outstanding", key: "outstanding", className: "hidden md:table-cell" },
  { header: "Coverage", key: "coverage", className: "hidden lg:table-cell" },
  { header: "Status", key: "status" },
  { header: "Date", key: "date", className: "hidden lg:table-cell" },
];

function computeOutstanding(p: any) {
  const total = Number(p.total_amount || 0);
  const discount = Number(p.discount || 0);
  const payable = Math.max(0, total - discount);
  const paid = Number(p.amount_paid || 0);
  return Math.max(0, Number((payable - paid).toFixed(2)));
}

const CashierPaymentsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  await requireAuthUserId();
  const isCashier = await checkRole("CASHIER");
  if (!isCashier) return null;

  const sp = await searchParams;
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const from = (sp?.from as string) || "";
  const to = (sp?.to as string) || "";

  const patientFilter = q
    ? ({
        OR: [
          { patient: { first_name: { contains: q, mode: "insensitive" } } },
          { patient: { last_name: { contains: q, mode: "insensitive" } } },
          { patient: { hospital_number: { contains: q, mode: "insensitive" } } },
        ],
      } as any)
    : {};

  const dateFilter = from || to ? {
    payment_date: {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + 'T23:59:59') }),
    },
  } : {};

  const baseWhere: any = { AND: [patientFilter, dateFilter] };

  if (status === "PAID") baseWhere.AND.push({ status: "PAID" });
  else if (status === "PART") baseWhere.AND.push({ status: "PART" });
  else if (status === "UNPAID") baseWhere.AND.push({ status: "UNPAID" });

  const [rowsRaw, paymentStats]: [any[], Stat[]] = await Promise.all([
    db.payment.findMany({
      include: {
        patient: { select: { first_name: true, last_name: true, hospital_number: true } },
        appointment: { select: { id: true, appointment_date: true } },
      },
      where: baseWhere,
      orderBy: { created_at: "desc" as any },
    }),
    db.payment.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { total_amount: true, amount_paid: true, discount: true },
    }),
  ]);

  let rows = rowsRaw;
  if (status === "OWING") {
    rows = rowsRaw.filter((p: any) => p.status === "UNPAID" || computeOutstanding(p) > 0);
  }

  const totalCount = rowsRaw.length;

  const chartData = paymentStats.map((stat: Stat) => ({
    status: stat.status,
    count: stat._count.status,
    amount: Math.max(0, Number(stat._sum.total_amount || 0) - Number((stat as any)._sum.discount || 0)),
  }));

  const csvData = rows.map(p => ({
    "Patient Name": `${p.patient.first_name} ${p.patient.last_name}`.trim(),
    "Hospital Number": p.patient.hospital_number || "-",
    "Receipt Number": p.receipt_number,
    "Total Amount": Number(p.total_amount || 0),
    "Amount Paid": Number(p.amount_paid || 0),
    "Coverage Type": p.coverage_type ?? "NONE",
    "HMO Provider": p.coverage_type === "INSURANCE" ? (p.coverage_notes || "") : "",
    "Coverage Ref": p.coverage_type === "INSURANCE" ? (p.coverage_reference || "") : "",
    "Outstanding": computeOutstanding(p),
    "Status": p.status,
    "Payment Date": format(p.payment_date, "yyyy-MM-dd"),
  }));

  const renderRow = (p: any) => {
    const patient = p.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();
    const outstanding = computeOutstanding(p);
    const statusLabel = p.status === "PAID" && outstanding === 0 ? "PAID" : p.status === "PART" && outstanding > 0 ? "PART" : p.status;

    return (
      <tr key={p.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td className="py-3">{(p.index ?? 0) + 1}</td>
        <td>
          <div className="flex flex-col">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{patient.hospital_number ?? "-"}</div>
          </div>
        </td>
        <td className="hidden lg:table-cell">#{p.receipt_number}</td>
        <td className="hidden md:table-cell">{formatCurrency(Number(p.total_amount || 0))}</td>
        <td className="hidden md:table-cell">{formatCurrency(Number(p.amount_paid || 0))}</td>
        <td className="hidden md:table-cell">{formatCurrency(outstanding)}</td>
        <td className="hidden lg:table-cell">
          <div className="flex flex-col">
            <span>{p.coverage_type ?? "NONE"}</span>
            {p.coverage_type === "INSURANCE" && (
              <span className="text-xs text-gray-500">{p.coverage_notes ?? ""}{p.coverage_reference ? ` • ${p.coverage_reference}` : ""}</span>
            )}
          </div>
        </td>
        <td>
          <span className={`px-2 py-0.5 rounded text-xs border ${
            statusLabel === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
            statusLabel === "PART" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
            "bg-red-100 text-red-800 border-red-200"
          }`}>
            {statusLabel}
          </span>
        </td>
        <td className="hidden lg:table-cell">{format(p.payment_date, "yyyy-MM-dd")}</td>
      </tr>
    );
  };

  const totalAmount = rows.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
  const totalPaid = rows.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
  const totalOutstanding = rows.reduce((sum, p) => sum + computeOutstanding(p), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Paid</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Outstanding</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentStatusDistributionChart data={chartData} />
        <ReceivablesOverTimeChart 
          data={[
            { date: "2024-01", total: 150000, paid: 120000, outstanding: 30000 },
            { date: "2024-02", total: 180000, paid: 140000, outstanding: 40000 },
            { date: "2024-03", total: 220000, paid: 170000, outstanding: 50000 },
            { date: "2024-04", total: 190000, paid: 160000, outstanding: 30000 },
            { date: "2024-05", total: 250000, paid: 200000, outstanding: 50000 },
            { date: "2024-06", total: 280000, paid: 220000, outstanding: 60000 },
          ]}
        />
      </div>

      <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SearchInput />
            <DateRangeFilter />
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
          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={csvData as any[]}
              filenamePrefix="payments_report"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 max-h-[560px] overflow-y-auto">
          <Table columns={columns} data={rows as any[]} renderRow={renderRow} />
        </div>
      </div>
    </div>
  );
};

export default CashierPaymentsPage;
