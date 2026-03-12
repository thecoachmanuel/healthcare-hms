import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import { ProfileImage } from "@/components/profile-image";
import { UpdateLabTest } from "@/components/dialogs/update-lab-test";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

const columns = [
  { header: "Patient", key: "patient" },
  { header: "Test", key: "test" },
  { header: "Requested", key: "requested", className: "hidden md:table-cell" },
  { header: "Status", key: "status", className: "hidden md:table-cell" },
  { header: "Action", key: "action" },
];

const LabTestsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  await requireAuthUserId();
  const isLabScientist = await checkRole("LAB_SCIENTIST");
  if (!isLabScientist) return null;

  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

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
                img: true,
                colorCode: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    db.labTest.count(),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const renderRow = (item: any) => {
    const patient = item.medical_record.patient;
    const name = `${patient.first_name} ${patient.last_name}`.trim();

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="flex items-center gap-4 p-4">
          <ProfileImage
            url={patient.img!}
            name={name}
            bgColor={patient.colorCode!}
            textClassName="text-black"
          />
          <div>
            <h3 className="uppercase">{name}</h3>
            <span className="text-sm capitalize">{patient.gender}</span>
          </div>
        </td>
        <td>{item.services?.service_name}</td>
        <td className="hidden md:table-cell">
          {format(item.test_date, "yyyy-MM-dd")}
        </td>
        <td className="hidden md:table-cell">{item.status}</td>
        <td className="flex items-center gap-2">
          <Link
            className="text-blue-600 hover:underline text-sm"
            href={`/record/appointments/${item.medical_record.appointment_id}?cat=lab-test`}
          >
            Open
          </Link>
          <UpdateLabTest
            id={item.id}
            currentStatus={item.status}
            currentResult={item.result}
            currentNotes={item.notes}
          />
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
      </div>

      <div className="mt-4">
        <Table columns={columns} data={tests as any[]} renderRow={renderRow} />
        <Pagination
          totalPages={totalPages}
          currentPage={page}
          totalRecords={totalRecords}
          limit={DATA_LIMIT}
        />
      </div>
    </div>
  );
};

export default LabTestsPage;

