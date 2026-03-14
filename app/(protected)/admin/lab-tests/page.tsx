import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import { ProfileImage } from "@/components/profile-image";
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
  { header: "Unit", key: "unit", className: "hidden md:table-cell" },
  { header: "Test", key: "test" },
  { header: "Requested", key: "requested", className: "hidden lg:table-cell" },
  { header: "Status", key: "status", className: "hidden md:table-cell" },
  { header: "Action", key: "action" },
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
  const unit = (sp?.unit as string) || "";
  const status = (sp?.status as string) || "";
  const q = (sp?.q as string) || "";
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  const units = await db.labUnit.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const [tests, totalRecords, statusCounts] = await Promise.all([
    db.labTest.findMany({
      include: {
        services: { select: { id: true, service_name: true, lab_unit: { select: { name: true } } } },
        medical_record: {
          select: {
            appointment_id: true,
            patient: {
              select: {
                first_name: true,
                last_name: true,
                hospital_number: true,
                img: true,
                colorCode: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      where: {
        AND: [
          unit ? ({ services: { lab_unit_id: Number(unit) } } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  { medical_record: { patient: { first_name: { contains: q, mode: "insensitive" } } } },
                  { medical_record: { patient: { last_name: { contains: q, mode: "insensitive" } } } },
                  { medical_record: { patient: { hospital_number: { contains: q, mode: "insensitive" } } } },
                ],
              } as any)
            : {},
        ],
      } as any,
      skip,
      take: limit,
    }),
    db.labTest.count({
      where: {
        AND: [
          unit ? ({ services: { lab_unit_id: Number(unit) } } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  { medical_record: { patient: { first_name: { contains: q, mode: "insensitive" } } } },
                  { medical_record: { patient: { last_name: { contains: q, mode: "insensitive" } } } },
                  { medical_record: { patient: { hospital_number: { contains: q, mode: "insensitive" } } } },
                ],
              } as any)
            : {},
        ],
      } as any,
    }),
    db.labTest.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);
  const statusCountMap = Object.fromEntries(statusCounts.map((s: any) => [s.status, s._count.status]));

  const renderRow = (item: any) => {
    const patient = item.medical_record.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();
    const unitName = item.services?.lab_unit?.name ?? "-";

    return (
      <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td className="flex items-center gap-4 p-4">
          <ProfileImage url={patient.img!} name={name} bgColor={patient.colorCode!} textClassName="text-black" />
          <div>
            <h3 className="uppercase">{name}</h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-sm capitalize">{patient.gender}</span>
              {patient.hospital_number && <span className="text-xs text-gray-500">{patient.hospital_number}</span>}
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell">{unitName}</td>
        <td>{item.services?.service_name}</td>
        <td className="hidden lg:table-cell">{format(item.test_date, "yyyy-MM-dd")}</td>
        <td className="hidden md:table-cell">{item.status}</td>
        <td className="text-sm">#{item.medical_record.appointment_id}</td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm px-2 py-1 border rounded-md bg-slate-50">Total: {totalRecords}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Requested: {statusCountMap.REQUESTED ?? 0}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">In Progress: {(statusCountMap.RECEIVED ?? 0) + (statusCountMap.IN_PROGRESS ?? 0)}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Completed: {statusCountMap.COMPLETED ?? 0}</div>
          <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Approved: {statusCountMap.APPROVED ?? 0}</div>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <SelectFilter
            param="status"
            label="Status"
            options={[
              { label: "All", value: "" },
              { label: "Requested", value: "REQUESTED" },
              { label: "Sample Collected", value: "SAMPLE_COLLECTED" },
              { label: "Received", value: "RECEIVED" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Approved", value: "APPROVED" },
              { label: "Cancelled", value: "CANCELLED" },
            ]}
          />
          <SelectFilter
            param="unit"
            label="Unit"
            options={[{ label: "All", value: "" }, ...units.map((u: any) => ({ label: u.name, value: String(u.id) }))]}
          />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={tests as any[]} renderRow={renderRow} />
        <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalRecords} limit={DATA_LIMIT} />
      </div>
    </div>
  );
};

export default AdminLabTestsPage;

