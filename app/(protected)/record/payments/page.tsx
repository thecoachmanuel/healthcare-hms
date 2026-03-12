import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { TextFilter } from "@/components/filters/text-filter";
import { PaymentReportClient } from "@/components/reports/payment-report-client";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import React from "react";

const columns = [
  { header: "Receipt", key: "receipt" },
  { header: "Patient", key: "patient" },
  { header: "Date", key: "date", className: "hidden md:table-cell" },
  { header: "Total", key: "total", className: "hidden md:table-cell" },
  { header: "Paid", key: "paid" },
  { header: "Discount", key: "discount", className: "hidden xl:table-cell" },
  { header: "Coverage", key: "coverage", className: "hidden xl:table-cell" },
  { header: "Status", key: "status", className: "hidden md:table-cell" },
];

const PaymentsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  await requireAuthUserId();
  const isAllowed = (await checkRole("ADMIN" as any)) || (await checkRole("CASHIER" as any));
  if (!isAllowed) return null;

  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const coverage = (sp?.coverage as string) || "";
  const method = (sp?.method as string) || "";
  const from = (sp?.from as string) || "";
  const to = (sp?.to as string) || "";

  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  const dateFilter =
    from || to
      ? {
          payment_date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {};

  const where = {
    AND: [
      dateFilter,
      status ? { status: status as any } : {},
      coverage ? { coverage_type: coverage as any } : {},
      method ? { payment_method: method as any } : {},
      q
        ? {
            OR: [
              { receipt_number: isNaN(Number(q)) ? undefined : Number(q) },
              { patient: { first_name: { contains: q, mode: "insensitive" } } },
              { patient: { last_name: { contains: q, mode: "insensitive" } } },
              { patient: { hospital_number: { contains: q, mode: "insensitive" } } },
            ].filter(Boolean),
          }
        : {},
    ],
  } as any;

  const [payments, totalRecords] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        patient: { select: { first_name: true, last_name: true, hospital_number: true } },
      },
      orderBy: { payment_date: "desc" },
      skip,
      take: limit,
    }),
    db.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const rows = payments.map((p: any) => {
    const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
    return {
      receipt_number: p.receipt_number,
      payment_date: format(p.payment_date, "yyyy-MM-dd"),
      bill_date: format(p.bill_date, "yyyy-MM-dd"),
      patient_name: patientName,
      hospital_number: p.patient?.hospital_number ?? null,
      total_amount: Number(p.total_amount ?? 0),
      amount_paid: Number(p.amount_paid ?? 0),
      discount: Number(p.discount ?? 0),
      status: p.status,
      payment_method: p.payment_method,
      coverage_type: p.coverage_type ?? "NONE",
      coverage_reference: p.coverage_reference ?? null,
      coverage_notes: p.coverage_notes ?? null,
      payment_reason: p.payment_reason ?? null,
    };
  });

  const daily = rows.reduce((acc: Record<string, number>, r) => {
    acc[r.payment_date] = (acc[r.payment_date] ?? 0) + r.amount_paid;
    return acc;
  }, {});
  const dailyData = Object.entries(daily)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 30)
    .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));

  const coverageAgg = rows.reduce((acc: Record<string, number>, r) => {
    const k = r.coverage_type ?? "NONE";
    acc[k] = (acc[k] ?? 0) + r.amount_paid;
    return acc;
  }, {});
  const coverageData = Object.entries(coverageAgg).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  const renderRow = (p: any) => {
    const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
    return (
      <tr
        key={p.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="py-4">#{p.receipt_number}</td>
        <td className="py-4">
          <div className="flex flex-col">
            <span className="uppercase">{patientName}</span>
            {p.patient?.hospital_number && (
              <span className="text-xs text-gray-500">{p.patient.hospital_number}</span>
            )}
          </div>
        </td>
        <td className="hidden md:table-cell">{format(p.payment_date, "yyyy-MM-dd")}</td>
        <td className="hidden md:table-cell">{Number(p.total_amount ?? 0).toFixed(2)}</td>
        <td className="text-emerald-600 font-medium">{Number(p.amount_paid ?? 0).toFixed(2)}</td>
        <td className="hidden xl:table-cell text-yellow-600">{Number(p.discount ?? 0).toFixed(2)}</td>
        <td className="hidden xl:table-cell">
          <div className="flex flex-col">
            <span>{p.coverage_type ?? "NONE"}</span>
            {p.coverage_reference && <span className="text-xs text-gray-500">{p.coverage_reference}</span>}
          </div>
        </td>
        <td className="hidden md:table-cell">{p.status}</td>
      </tr>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="hidden lg:flex items-center gap-1">
            <p className="text-2xl font-semibold">{totalRecords}</p>
            <span className="text-gray-600 text-sm xl:text-base">payments</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput />
            <SelectFilter
              param="status"
              label="Status"
              options={[
                { label: "All", value: "" },
                { label: "Paid", value: "PAID" },
                { label: "Partial", value: "PARTIAL" },
                { label: "Unpaid", value: "UNPAID" },
              ]}
            />
            <SelectFilter
              param="coverage"
              label="Coverage"
              options={[
                { label: "All", value: "" },
                { label: "None", value: "NONE" },
                { label: "Insurance", value: "INSURANCE" },
                { label: "NHIA", value: "NHIA" },
                { label: "Waiver", value: "WAIVER" },
                { label: "Other", value: "OTHER" },
              ]}
            />
            <SelectFilter
              param="method"
              label="Method"
              options={[
                { label: "All", value: "" },
                { label: "Cash", value: "CASH" },
                { label: "Card", value: "CARD" },
              ]}
            />
            <TextFilter param="from" label="From" placeholder="YYYY-MM-DD" />
            <TextFilter param="to" label="To" placeholder="YYYY-MM-DD" />
          </div>
        </div>

        <div className="mt-4">
          <Table columns={columns} data={payments as any[]} renderRow={renderRow} />
          <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalRecords} limit={DATA_LIMIT} />
        </div>
      </div>

      <PaymentReportClient rows={rows} daily={dailyData} coverage={coverageData} />
    </div>
  );
};

export default PaymentsPage;

