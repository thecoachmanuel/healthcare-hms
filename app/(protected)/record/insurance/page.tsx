import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { TextFilter } from "@/components/filters/text-filter";
import { PaymentReportClient } from "@/components/reports/payment-report-client";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getInsurancePatients, getInsuranceClaims, getDistinctInsuranceProviders } from "@/utils/services/payments";
import { format } from "date-fns";
import Link from "next/link";

const patientColumns = [
  { header: "Patient", key: "patient" },
  { header: "HN", key: "hospital_number", className: "hidden md:table-cell" },
  { header: "Provider", key: "provider" },
  { header: "Policy #", key: "policy", className: "hidden lg:table-cell" },
  { header: "Insured Bills", key: "total", className: "hidden xl:table-cell" },
  { header: "Paid", key: "paid", className: "hidden xl:table-cell" },
  { header: "Unpaid", key: "unpaid", className: "hidden xl:table-cell" },
  { header: "Last Activity", key: "last", className: "hidden lg:table-cell" },
];

const claimColumns = [
  { header: "Receipt", key: "receipt" },
  { header: "Patient", key: "patient" },
  { header: "HN", key: "hn", className: "hidden md:table-cell" },
  { header: "Bill Date", key: "bill_date", className: "hidden md:table-cell" },
  { header: "Total", key: "total", className: "hidden xl:table-cell" },
  { header: "Paid", key: "paid" },
  { header: "Coverage", key: "coverage" },
  { header: "Status", key: "status", className: "hidden lg:table-cell" },
  { header: "Actions", key: "actions" },
];

const InsurancePage = async (props: SearchParamsProps) => {
  await requireAuthUserId();
  const [isAdmin, isCashier] = await Promise.all([
    checkRole("ADMIN" as any),
    checkRole("CASHIER" as any),
  ]);
  const isAllowed = isAdmin || isCashier;
  if (!isAllowed) return null;

  const searchParams = await props.searchParams;
  const cat = ((searchParams?.cat as string) || "patients") as "patients" | "claims" | "reports";

  if (cat === "patients") {
    const page = (searchParams?.p || "1") as string;
    const q = (searchParams?.q || "") as string;
    const coverage = (searchParams?.coverage || "") as string;
    const provider = (searchParams?.provider || "") as string;

    const providerOptionsSrc = await getDistinctInsuranceProviders();
    const providerOptions = [
      { label: "All Providers", value: "" },
      ...providerOptionsSrc.map((p) => ({ label: p, value: p })),
    ];

    const { data, totalPages, totalRecords, currentPage } = await getInsurancePatients({
      page,
      limit: DATA_LIMIT,
      search: q || undefined,
      coverage: coverage || undefined,
      provider: provider || undefined,
    });

    const renderRow = (row: any) => (
      <tr
        key={row.patient_id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="py-3">
          <div className="flex flex-col">
            <span className="uppercase">{row.name}</span>
            <span className="text-xs text-gray-500">{row.phone}</span>
          </div>
        </td>
        <td className="hidden md:table-cell text-xs text-gray-700">{row.hospital_number ?? "-"}</td>
        <td>
          <div className="flex flex-col">
            <span>{row.insurance_provider || "-"}</span>
          </div>
        </td>
        <td className="hidden lg:table-cell text-xs text-gray-700">{row.insurance_number || "-"}</td>
        <td className="hidden xl:table-cell">{row.total_amount.toFixed(2)}</td>
        <td className="hidden xl:table-cell text-emerald-600 font-medium">{row.total_paid.toFixed(2)}</td>
        <td className="hidden xl:table-cell text-red-600">{row.total_unpaid.toFixed(2)}</td>
        <td className="hidden lg:table-cell text-xs text-gray-600">
          {row.last_payment_date ? format(row.last_payment_date, "yyyy-MM-dd") : "-"}
        </td>
      </tr>
    );

    return (
      <div className="p-6 space-y-6">
        <HeaderTabs cat="patients" />
        <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="hidden lg:flex items-center gap-1">
              <p className="text-2xl font-semibold">{totalRecords}</p>
              <span className="text-gray-600 text-sm xl:text-base">insured patients</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput />
              <SelectFilter
                param="coverage"
                label="Coverage Type"
                options={[
                  { label: "All", value: "" },
                  { label: "Insurance", value: "INSURANCE" },
                  { label: "NHIA", value: "NHIA" },
                  { label: "Waiver", value: "WAIVER" },
                  { label: "Other", value: "OTHER" },
                ]}
              />
            <SelectFilter param="provider" label="Provider" options={providerOptions} />
            </div>
          </div>

          <div className="mt-4">
            <Table columns={patientColumns} data={data as any[]} renderRow={renderRow} />
            {totalPages > 1 && (
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                totalRecords={totalRecords}
                limit={DATA_LIMIT}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cat === "claims") {
    const page = (searchParams?.p || "1") as string;
    const q = (searchParams?.q || "") as string;
    const status = (searchParams?.status || "") as string;
    const coverage = (searchParams?.coverage || "") as string;
    const from = (searchParams?.from || "") as string;
    const to = (searchParams?.to || "") as string;
    const provider = (searchParams?.provider || "") as string;

    const providerOptionsSrc = await getDistinctInsuranceProviders();
    const providerOptions = [
      { label: "All Providers", value: "" },
      ...providerOptionsSrc.map((p) => ({ label: p, value: p })),
    ];

    const { data, totalPages, totalRecords, currentPage } = await getInsuranceClaims({
      page,
      limit: DATA_LIMIT,
      search: q || undefined,
      status: status || undefined,
      coverage: coverage || undefined,
      from: from || undefined,
      to: to || undefined,
      provider: provider || undefined,
    });

    const renderRow = (p: any) => {
      const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
      const claimStatus = deriveClaimStatus(p.status, p.amount_paid, p.total_amount, p.discount);

      return (
        <tr
          key={p.id}
          className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
        >
          <td className="py-3">#{p.receipt_number}</td>
          <td className="py-3">
            <div className="flex flex-col">
              <span className="uppercase">{patientName}</span>
              <span className="text-xs text-gray-500">{p.patient?.insurance_provider ?? ""}</span>
            </div>
          </td>
          <td className="hidden md:table-cell text-xs text-gray-700">{p.patient?.hospital_number ?? "-"}</td>
          <td className="hidden md:table-cell">{format(p.bill_date, "yyyy-MM-dd")}</td>
          <td className="hidden xl:table-cell">{Number(p.total_amount ?? 0).toFixed(2)}</td>
          <td className="text-emerald-600 font-medium">{Number(p.amount_paid ?? 0).toFixed(2)}</td>
          <td>
            <div className="flex flex-col text-xs">
              <span>{p.coverage_type}</span>
              {p.coverage_reference && (
                <span className="text-gray-500">{p.coverage_reference}</span>
              )}
            </div>
          </td>
          <td className="hidden lg:table-cell text-xs text-gray-700">{claimStatus}</td>
          <td>
            <Link
              href={`/record/appointments/${p.appointment_id}?cat=bills`}
              className="text-blue-600 hover:underline text-xs"
            >
              View Bill
            </Link>
          </td>
        </tr>
      );
    };

    return (
      <div className="p-6 space-y-6">
        <HeaderTabs cat="claims" />
        <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="hidden lg:flex items-center gap-1">
              <p className="text-2xl font-semibold">{totalRecords}</p>
              <span className="text-gray-600 text-sm xl:text-base">claims</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput />
              <SelectFilter
                param="status"
                label="Status"
                options={[
                  { label: "All", value: "" },
                  { label: "Paid", value: "PAID" },
                  { label: "Partial", value: "PART" },
                  { label: "Unpaid", value: "UNPAID" },
                ]}
              />
              <SelectFilter
                param="coverage"
                label="Coverage"
                options={[
                  { label: "All", value: "" },
                  { label: "Insurance", value: "INSURANCE" },
                  { label: "NHIA", value: "NHIA" },
                  { label: "Waiver", value: "WAIVER" },
                  { label: "Other", value: "OTHER" },
                ]}
              />
            <SelectFilter param="provider" label="Provider" options={providerOptions} />
              <TextFilter param="from" label="From" placeholder="YYYY-MM-DD" />
              <TextFilter param="to" label="To" placeholder="YYYY-MM-DD" />
            </div>
          </div>

          <div className="mt-4">
            <Table columns={claimColumns} data={data as any[]} renderRow={renderRow} />
            {totalPages > 1 && (
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                totalRecords={totalRecords}
                limit={DATA_LIMIT}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const q = (searchParams?.q || "") as string;
  const coverage = (searchParams?.coverage || "") as string;
  const status = (searchParams?.status || "") as string;
  const method = (searchParams?.method || "") as string;
  const from = (searchParams?.from || "") as string;
  const to = (searchParams?.to || "") as string;

  const limit = DATA_LIMIT;
  const page = Number((searchParams?.p || "1") as string) || 1;
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
      { coverage_type: { not: "NONE" } },
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
  }, {} as Record<string, number>);

  const dailyData = Object.entries(daily)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 30)
    .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));

  const coverageAgg = rows.reduce((acc: Record<string, number>, r) => {
    const k = r.coverage_type ?? "NONE";
    acc[k] = (acc[k] ?? 0) + r.amount_paid;
    return acc;
  }, {} as Record<string, number>);

  const coverageData = Object.entries(coverageAgg).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  return (
    <div className="p-6 space-y-6">
      <HeaderTabs cat="reports" />
      <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="hidden lg:flex items-center gap-1">
            <p className="text-2xl font-semibold">{totalRecords}</p>
            <span className="text-gray-600 text-sm xl:text-base">insurance payments</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput />
            <SelectFilter
              param="status"
              label="Status"
              options={[
                { label: "All", value: "" },
                { label: "Paid", value: "PAID" },
                { label: "Partial", value: "PART" },
                { label: "Unpaid", value: "UNPAID" },
              ]}
            />
            <SelectFilter
              param="coverage"
              label="Coverage"
              options={[
                { label: "All", value: "" },
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
          <PaymentReportClient rows={rows as any[]} daily={dailyData} coverage={coverageData} />
        </div>
      </div>
    </div>
  );
};

function HeaderTabs({ cat }: { cat: "patients" | "claims" | "reports" }) {
  const tabs: { key: "patients" | "claims" | "reports"; label: string }[] = [
    { key: "patients", label: "Patients" },
    { key: "claims", label: "Claims" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`/record/insurance?cat=${t.key}`}
          className={
            "px-3 py-2 text-sm rounded-t-md border-b-2 " +
            (cat === t.key
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-slate-50")
          }
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function deriveClaimStatus(status: string, amountPaid: number, totalAmount: number, discount: number) {
  const unpaid = Math.max(0, Number(totalAmount ?? 0) - Number(amountPaid ?? 0) - Number(discount ?? 0));
  if (status === "UNPAID") return "Awaiting insurer";
  if (status === "PART") return unpaid > 0 ? "Partially settled" : "Settled";
  if (status === "PAID") return unpaid > 0 ? "Settled with balance" : "Settled";
  return status;
}

export default InsurancePage;
