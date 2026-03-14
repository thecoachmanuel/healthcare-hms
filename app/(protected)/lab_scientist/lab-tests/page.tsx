import { Pagination } from "@/components/pagination";
import { Table } from "@/components/tables/table";
import { ProfileImage } from "@/components/profile-image";
import { UpdateLabTest, ApproveLabTestButton } from "@/components/dialogs/update-lab-test";
import SearchInput from "@/components/search-input";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";
import { SelectFilter } from "@/components/filters/select-filter";
import { AddService } from "@/components/dialogs/add-service";

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
  const userId = await requireAuthUserId();
  const isLabScientist = await checkRole("LAB_SCIENTIST");
  const isLabTechnician = await checkRole("LAB_TECHNICIAN");
  const isLabReceptionist = await checkRole("LAB_RECEPTIONIST");
  if (!isLabScientist && !isLabTechnician && !isLabReceptionist) return null;

  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const unit = (sp?.unit as string) || "";
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  const staff = await db.staff.findUnique({
    where: { id: userId },
    select: { lab_unit_id: true },
  });

  const allowedUnitId = staff?.lab_unit_id ? String(staff.lab_unit_id) : "";
  const unitFilter = isLabScientist ? unit : allowedUnitId;

  const units = await db.labUnit.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
      where: {
        AND: [
          unitFilter ? ({ services: { lab_unit_id: Number(unitFilter) } } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  {
                    medical_record: {
                      patient: {
                        first_name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                  {
                    medical_record: {
                      patient: {
                        last_name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                  {
                    medical_record: {
                      patient: {
                        hospital_number: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
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
          unitFilter ? ({ services: { lab_unit_id: Number(unitFilter) } } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  {
                    medical_record: {
                      patient: {
                        first_name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                  {
                    medical_record: {
                      patient: {
                        last_name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                  {
                    medical_record: {
                      patient: {
                        hospital_number: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                ],
              } as any)
            : {},
        ],
      } as any,
    }),
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
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-sm capitalize">{patient.gender}</span>
              {patient.hospital_number && (
                <span className="text-xs text-gray-500">{patient.hospital_number}</span>
              )}
            </div>
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
          <Link
            className="text-emerald-700 hover:underline text-sm"
            href={`/lab/print/${item.id}`}
          >
            Print
          </Link>
          {(isLabScientist || isLabTechnician) && (
            <UpdateLabTest
              id={item.id}
              currentStatus={item.status}
              currentResult={item.result}
              currentNotes={item.notes}
              currentSampleId={(item as any).sample_id}
              canApprove={isLabScientist}
            />
          )}
          {isLabScientist && item.status !== "APPROVED" && item.status === "COMPLETED" && (
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
          {isLabScientist && (
            <SelectFilter
              param="unit"
              label="Unit"
              options={[
                { label: "All", value: "" },
                ...units.map((u: any) => ({ label: u.name, value: String(u.id) })),
              ]}
            />
          )}
          {(isLabScientist || isLabReceptionist) && (
            <AddService
              category="LAB_TEST"
              buttonText="Add Lab Test"
              title="Add Lab Test"
              description="Create a lab test under your unit."
              labUnits={(() => {
                const opts = units.map((u: any) => ({ label: u.name, value: String(u.id) }));
                if (isLabScientist) return opts;
                // Restrict receptionist to their own unit
                return opts.filter((u: any) => u.value === allowedUnitId);
              })()}
            />
          )}
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
