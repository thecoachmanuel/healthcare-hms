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
import Link from "next/link";
import React from "react";

const columns = [
  { header: "Patient", key: "patient" },
  { header: "Doctor", key: "doctor", className: "hidden md:table-cell" },
  { header: "Status", key: "status", className: "hidden md:table-cell" },
  { header: "Date", key: "date", className: "hidden xl:table-cell" },
  { header: "Action", key: "action" },
];

const PharmacistPrescriptionsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  await requireAuthUserId();
  const isAllowed = (await checkRole("ADMIN" as any)) || (await checkRole("PHARMACIST" as any));
  if (!isAllowed) return null;

  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  const [data, totalRecords] = await Promise.all([
    db.prescription.findMany({
      include: {
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
        doctor: { select: { name: true } },
        items: { select: { id: true } },
      },
      orderBy: { created_at: "desc" },
      where: {
        AND: [
          status ? { status: status as any } : {},
          q
            ? {
                OR: [
                  {
                    patient: {
                      first_name: { contains: q, mode: "insensitive" },
                    },
                  },
                  {
                    patient: {
                      last_name: { contains: q, mode: "insensitive" },
                    },
                  },
                  {
                    patient: {
                      hospital_number: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
        ],
      } as any,
      skip,
      take: limit,
    }),
    db.prescription.count({
      where: {
        AND: [
          status ? { status: status as any } : {},
          q
            ? {
                OR: [
                  {
                    patient: {
                      first_name: { contains: q, mode: "insensitive" },
                    },
                  },
                  {
                    patient: {
                      last_name: { contains: q, mode: "insensitive" },
                    },
                  },
                  {
                    patient: {
                      hospital_number: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
        ],
      } as any,
    }),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const appointmentIds = Array.from(new Set((data as any[]).map((p) => p.appointment_id).filter(Boolean)));
  const payments = appointmentIds.length
    ? await db.payment.findMany({ where: { appointment_id: { in: appointmentIds } }, select: { appointment_id: true, status: true } })
    : [];
  const payMap = new Map(payments.map((p: any) => [p.appointment_id, p.status]));

  const renderRow = (item: any) => {
    const patient = item.patient;
    const patientName = `${patient.first_name} ${patient.last_name}`.trim();

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="flex items-center gap-4 p-4">
          <ProfileImage
            url={patient.img!}
            name={patientName}
            bgColor={patient.colorCode!}
            textClassName="text-black"
          />
          <div>
            <h3 className="uppercase">{patientName}</h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-sm capitalize">{patient.gender}</span>
              {patient.hospital_number && (
                <span className="text-xs text-gray-500">{patient.hospital_number}</span>
              )}
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.doctor?.name}</td>
        <td className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <span>{item.status}</span>
            {(() => {
              const st = payMap.get(item.appointment_id);
              const cls = st === "PAID" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : st === "PART" ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                : "bg-rose-100 text-rose-700 border-rose-200";
              return (
                <span title={`Payment: ${st || "UNPAID"}`}
                  className={`text-[10px] px-2 py-0.5 rounded border ${cls}`}>
                  {st || "UNPAID"}
                </span>
              );
            })()}
          </div>
        </td>
        <td className="hidden xl:table-cell">{format(item.created_at, "yyyy-MM-dd")}</td>
        <td>
          <Link
            className="text-blue-600 hover:underline text-sm"
            href={`/pharmacist/prescriptions/${item.id}`}
          >
            Open
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">total records</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <SelectFilter
            param="status"
            label="Status"
            options={[
              { label: "All", value: "" },
              { label: "Issued", value: "ISSUED" },
              { label: "Dispensed", value: "DISPENSED" },
              { label: "Cancelled", value: "CANCELLED" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={data as any[]} renderRow={renderRow} />
        <Pagination totalPages={totalPages} currentPage={page} totalRecords={totalRecords} limit={DATA_LIMIT} />
      </div>
    </div>
  );
};

export default PharmacistPrescriptionsPage;
