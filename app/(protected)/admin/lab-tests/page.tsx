import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import React from "react";
import { ProfileImage } from "@/components/profile-image";
import Link from "next/link";
import { UpdateLabTest, ApproveLabTestButton } from "@/components/dialogs/update-lab-test";

const columns = [
  { header: "S/N", key: "sn" },
  { header: "Patient", key: "patient" },
  { header: "Test", key: "test" },
  { header: "Requested", key: "requested", className: "hidden md:table-cell" },
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
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const unit = (sp?.unit as string) || "";
  const from = (sp?.from as string) || "";
  const to = (sp?.to as string) || "";
  const pay = (sp?.pay as string) || "";
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

  const payFilter: any = pay
    ? pay === "PAID"
      ? ({ medical_record: { appointment: { bills: { some: { status: "PAID" as any } } } } } as any)
      : pay === "PART"
      ? ({ medical_record: { appointment: { bills: { some: { status: "PART" as any } } } } } as any)
      : ({ OR: [
            { medical_record: { appointment: { bills: { none: {} } } } } as any,
            { medical_record: { appointment: { bills: { some: { status: "UNPAID" as any } } } } } as any,
          ] } as any)
    : {};

  const statusFilter: any = status ? ({ status: status as any } as any) : {};
  const unitFilter: any = unit ? ({ services: { lab_unit_id: Number(unit) } } as any) : {};

  const where: any = {
    AND: [patientFilter, dateFilter, payFilter, statusFilter, unitFilter],
  };

  const units = await db.labUnit.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const selectedUnitName = unit
    ? units.find((u: any) => String(u.id) === String(unit))?.name ?? ""
    : "";

  const [tests, totalRecords] = await Promise.all([
    db.labTest.findMany({
      include: {
        services: { select: { id: true, service_name: true } },
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
      where,
      skip,
      take: limit,
    }),
    db.labTest.count({ where }),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const appointmentIds = Array.from(new Set((tests as any[]).map((t) => t.medical_record.appointment_id).filter(Boolean)));
  const payments = appointmentIds.length
    ? await db.payment.findMany({ where: { appointment_id: { in: appointmentIds } }, select: { appointment_id: true, status: true } })
    : [];
  const payMap = new Map(payments.map((p: any) => [p.appointment_id, p.status]));

  const renderRow = (item: any) => {
    const patient = item.medical_record.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();

    return (
      <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td className="py-4 px-2">{(item as any).index + 1}</td>
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
        <td>
          <div className="flex items-center gap-2">
            <span>{item.services?.service_name}</span>
            {(() => {
              const st = payMap.get(item.medical_record.appointment_id);
              const cls =
                st === "PAID"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : st === "PART"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-rose-100 text-rose-700 border-rose-200";
              return (
                <span title={`Payment: ${st || "UNPAID"}`} className={`text-[10px] px-2 py-0.5 rounded border ${cls}`}>
                  {st || "UNPAID"}
                </span>
              );
            })()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            <span title="Requested at" className="mr-3">
              Req: {format(item.test_date, "yyyy-MM-dd HH:mm")}
            </span>
            <span title="Approved at">Appr: {item.approved_at ? format(item.approved_at, "yyyy-MM-dd HH:mm") : "-"}</span>
          </div>
        </td>
        <td className="hidden md:table-cell">{format(item.test_date, "yyyy-MM-dd")}</td>
        <td className="hidden md:table-cell">{item.status}</td>
        <td className="flex items-center gap-2">
          <Link className="text-blue-600 hover:underline text-sm" href={`/record/appointments/${item.medical_record.appointment_id}?cat=lab-test`}>
            Open
          </Link>
          <UpdateLabTest
            id={item.id}
            currentStatus={item.status}
            currentResult={item.result}
            currentNotes={item.notes}
            currentSampleId={(item as any).sample_id}
            canApprove
          />
          {item.status === "APPROVED" && (
            <Link className="text-emerald-700 hover:underline text-sm" href={`/lab/print/${item.id}`}>
              Print
            </Link>
          )}
          {item.status !== "APPROVED" && item.status === "COMPLETED" && (
            <ApproveLabTestButton id={item.id} currentResult={item.result} currentSampleId={(item as any).sample_id} />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">total tests</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <DateRangeFilter />
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
            param="pay"
            label="Payment"
            options={[
              { label: "All", value: "" },
              { label: "Paid", value: "PAID" },
              { label: "Part", value: "PART" },
              { label: "Unpaid", value: "UNPAID" },
            ]}
          />
          {selectedUnitName ? (
            <div className="text-xs px-2 py-1 border rounded-md bg-slate-50">Unit: {selectedUnitName}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 max-h-[65vh] overflow-y-auto">
        <Table columns={columns} data={tests as any[]} renderRow={renderRow} />
        <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalRecords} limit={DATA_LIMIT} />
      </div>
    </div>
  );
};

export default AdminLabTestsPage;
