import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { LabVolumeByUnitChart, LabTestStatusChart } from "@/components/charts/admin-reports";
import { downloadCSV } from "@/lib/csv-export";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import React from "react";

const columns = [
  { header: "Patient", key: "patient" },
  { header: "Test", key: "test" },
  { header: "Unit", key: "unit" },
  { header: "Status", key: "status" },
  { header: "Result", key: "result", className: "hidden lg:table-cell" },
  { header: "Requested Date", key: "requestedDate", className: "hidden md:table-cell" },
  { header: "Completed Date", key: "completedDate", className: "hidden lg:table-cell" },
  { header: "Actions", key: "actions" },
];

const AdminLabTestsPage = async ({
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
  const status = (sp?.status as string) || "";
  const unit = (sp?.unit as string) || "";
  const from = (sp?.from as string) || "";
  const to = (sp?.to as string) || "";
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  // Base filter by patient name or hospital number
  const patientFilter = q
    ? ({
        OR: [
          { medical_record: { patient: { first_name: { contains: q, mode: "insensitive" } } } },
          { medical_record: { patient: { last_name: { contains: q, mode: "insensitive" } } } },
          { medical_record: { patient: { hospital_number: { contains: q, mode: "insensitive" } } } },
        ],
      } as any)
    : {};

  // Date range filter
  const dateFilter = from || to ? ({
    test_date: {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + 'T23:59:59') }),
    },
  } as any) : {};

  const baseWhere: any = { AND: [patientFilter, dateFilter] };

  if (status) baseWhere.AND.push({ status: status });
  if (unit) baseWhere.AND.push({ services: { lab_unit_id: Number(unit) } });

  const [rowsRaw, counts, labStats, units] = await Promise.all([
    db.labTest.findMany({
      include: {
        medical_record: { select: { patient: { select: { first_name: true, last_name: true, hospital_number: true } } } },
        services: { select: { service_name: true, lab_unit: { select: { name: true, id: true } } } },
      },
      where: baseWhere,
      orderBy: { test_date: "desc" as any },
      skip,
      take: limit,
    }),
    Promise.all([
      db.labTest.count({ where: {} }),
      db.labTest.count({ where: { status: "PENDING" as any } }),
      db.labTest.count({ where: { status: "IN_PROGRESS" as any } }),
      db.labTest.count({ where: { status: "COMPLETED" as any } }),
    ]),
    db.labTest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.labUnit.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  let rows = rowsRaw;
  if (status === "PENDING") rows = rowsRaw.filter((t: any) => t.status === "PENDING");
  else if (status === "IN_PROGRESS") rows = rowsRaw.filter((t: any) => t.status === "IN_PROGRESS");
  else if (status === "COMPLETED") rows = rowsRaw.filter((t: any) => t.status === "COMPLETED");

  const [totalCount, pendingCount, inProgressCount, completedCount] = counts as number[];

  // Prepare chart data for lab test status
  const statusChartData = labStats.map(stat => ({
    status: stat.status,
    count: stat._count.status,
  }));

  // Prepare lab volume by unit data
  const labTestsForVolume = await db.labTest.findMany({
    include: { services: { select: { lab_unit: { select: { id: true, name: true } } } } },
    where: { ...(from || to ? dateFilter : {}), ...(unit ? { services: { lab_unit_id: Number(unit) } } : {}) },
  });

  const unitCounts: Record<number, { name: string; count: number }> = {};
  for (const t of labTestsForVolume as any[]) {
    const u = t.services?.lab_unit;
    if (!u) continue;
    if (!unitCounts[u.id]) unitCounts[u.id] = { name: u.name, count: 0 };
    unitCounts[u.id].count += 1;
  }
  const labVolumeChartData = Object.values(unitCounts).map(u => ({ unit: u.name, count: u.count })).sort((a, b) => b.count - a.count);

  // Prepare CSV data
  const csvData = rows.map((t: any) => ({
    "Patient Name": `${t.medical_record.patient.first_name} ${t.medical_record.patient.last_name}`.trim(),
    "Hospital Number": t.medical_record.patient.hospital_number || "-",
    "Test Name": t.services?.service_name || "-",
    "Lab Unit": t.services?.lab_unit?.name || "-",
    "Status": t.status,
    "Result": t.result || "-",
    "Test Date": format(t.test_date, "yyyy-MM-dd"),
    "Approved Date": t.approved_at ? format(t.approved_at, "yyyy-MM-dd") : (t.analysis_completed_at ? format(t.analysis_completed_at, "yyyy-MM-dd") : "-"),
  }));

  const handleExportCSV = () => {
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    downloadCSV(csvData, `lab_tests_report_${timestamp}.csv`);
  };

  const renderRow = (t: any) => {
    const patient = t.medical_record.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();

    return (
      <tr key={t.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td>
          <div className="flex flex-col">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{patient.hospital_number ?? "-"}</div>
          </div>
        </td>
        <td>{t.services?.service_name}</td>
        <td>{t.services?.lab_unit?.name ?? '-'}</td>
        <td>
          <span className={`px-2 py-0.5 rounded text-xs border ${
            t.status === "PENDING" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
            t.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 border-blue-200" :
            t.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
            "bg-gray-100 text-gray-800 border-gray-200"
          }`}>
            {t.status}
          </span>
        </td>
        <td className="hidden lg:table-cell">
          {t.result ? (
            <span className="text-sm text-gray-700">{t.result}</span>
          ) : (
            <span className="text-xs text-gray-500">-</span>
          )}
        </td>
        <td className="hidden md:table-cell">{format(t.test_date, "yyyy-MM-dd")}</td>
        <td className="hidden lg:table-cell">
          {t.approved_at ? format(t.approved_at, "yyyy-MM-dd") : (t.analysis_completed_at ? format(t.analysis_completed_at, "yyyy-MM-dd") : "-")}
        </td>
        <td>
          <a
            href={`/lab/print/${t.id}`}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            target="_blank"
            rel="noreferrer"
          >
            View / Print
          </a>
        </td>
      </tr>
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Calculate summary statistics

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Tests</h3>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LabTestStatusChart data={statusChartData} />
        <LabVolumeByUnitChart data={labVolumeChartData} />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm px-2 py-1 border rounded-md bg-slate-50">Total: {totalCount}</div>
            <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Pending: {pendingCount}</div>
            <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">In Progress: {inProgressCount}</div>
            <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Completed: {completedCount}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Export CSV
            </button>
            <SearchInput />
            <DateRangeFilter />
            <SelectFilter
              param="status"
              label="Status"
              options={[
                { label: "All", value: "" },
                { label: "Pending", value: "PENDING" },
                { label: "In Progress", value: "IN_PROGRESS" },
                { label: "Completed", value: "COMPLETED" },
              ]}
            />
            <SelectFilter
              param="unit"
              label="Lab Unit"
              options={[
                { label: "All Units", value: "" },
                ...units.map(unit => ({ label: unit.name, value: String(unit.id) })),
              ]}
            />
          </div>
        </div>

        <div className="mt-4">
          <Table columns={columns} data={rows as any[]} renderRow={renderRow} />
          <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalCount} limit={DATA_LIMIT} />
        </div>
      </div>
    </div>
  );
};

export default AdminLabTestsPage;
