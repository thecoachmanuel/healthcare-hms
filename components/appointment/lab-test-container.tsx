import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table } from "../tables/table";
import { format } from "date-fns";
import { RequestLabTest } from "../dialogs/request-lab-test";
import { UpdateLabTest } from "../dialogs/update-lab-test";

const columns = [
  { header: "Test", key: "test" },
  { header: "Requested", key: "requested", className: "hidden md:table-cell" },
  { header: "Status", key: "status", className: "hidden md:table-cell" },
  { header: "Result", key: "result", className: "hidden xl:table-cell" },
  { header: "Actions", key: "action" },
];

export const LabTestContainer = async ({
  appointmentId,
}: {
  appointmentId: string;
}) => {
  await requireAuthUserId();
  const isPatient = await checkRole("PATIENT");
  const isLabScientist = await checkRole("LAB_SCIENTIST");
  const canRequest = (await checkRole("ADMIN")) || (await checkRole("DOCTOR")) || (await checkRole("NURSE"));

  const appointment = await db.appointment.findUnique({
    where: { id: Number(appointmentId) },
    select: { id: true, patient_id: true, doctor_id: true },
  });

  if (!appointment) return null;

  const medical =
    (await db.medicalRecords.findFirst({
      where: { appointment_id: Number(appointmentId) },
      select: { id: true },
      orderBy: { created_at: "desc" },
    })) ?? null;

  const [tests, services] = await Promise.all([
    medical
      ? db.labTest.findMany({
          where: { record_id: medical.id },
          include: { services: { select: { id: true, service_name: true } } },
          orderBy: { created_at: "desc" },
        })
      : Promise.resolve([]),
    canRequest
      ? db.services.findMany({
          select: { id: true, service_name: true },
          orderBy: { service_name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const serviceOptions = services.map((s) => ({
    label: s.service_name,
    value: String(s.id),
  }));

  const renderRow = (item: any) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="py-2 xl:py-6">{item?.services?.service_name}</td>
        <td className="hidden md:table-cell">
          {format(item?.test_date, "yyyy-MM-dd")}
        </td>
        <td className="hidden md:table-cell">{item?.status}</td>
        <td className="hidden xl:table-cell">
          {isPatient && item?.status !== "COMPLETED" ? (
            <span className="text-gray-400 italic">Pending</span>
          ) : (
            <span className="whitespace-pre-wrap">{item?.result}</span>
          )}
        </td>
        <td>
          {isLabScientist ? (
            <UpdateLabTest
              id={item.id}
              currentStatus={item.status}
              currentResult={item.result}
              currentNotes={item.notes}
            />
          ) : (
            <span className="text-gray-400 italic">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Card className="shadow-none bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lab Requests & Results</CardTitle>
        {canRequest && <RequestLabTest appointmentId={appointmentId} services={serviceOptions} />}
      </CardHeader>
      <CardContent>
        <Table columns={columns} data={tests as any[]} renderRow={renderRow} />
      </CardContent>
    </Card>
  );
};

