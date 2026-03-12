import { MarkPrescriptionDispensed } from "@/components/dialogs/mark-prescription-dispensed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import Link from "next/link";
import React from "react";

const PrescriptionDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  await requireAuthUserId();
  const isAllowed = (await checkRole("ADMIN")) || (await checkRole("PHARMACIST"));
  if (!isAllowed) return null;

  const params = await props.params;
  const prescription = await db.prescription.findUnique({
    where: { id: Number(params.id) },
    include: {
      patient: { select: { first_name: true, last_name: true, id: true } },
      doctor: { select: { name: true } },
      items: { include: { medication: { select: { service_name: true } } } },
    },
  });

  if (!prescription) return null;

  const patientName = `${prescription.patient.first_name} ${prescription.patient.last_name}`.trim();

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prescription #{prescription.id}</CardTitle>
            <p className="text-sm text-gray-500">
              Patient: {patientName} • Doctor: {prescription.doctor?.name} • Status: {prescription.status}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {prescription.appointment_id ? (
              <Link
                className="text-blue-600 hover:underline text-sm"
                href={`/record/appointments/${prescription.appointment_id}?cat=prescriptions`}
              >
                Open Appointment
              </Link>
            ) : null}
            {prescription.status !== "DISPENSED" ? (
              <MarkPrescriptionDispensed id={prescription.id} />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Items</h2>
            <ul className="list-disc pl-5 text-sm">
              {prescription.items.map((i: any) => (
                <li key={i.id}>
                  {i.medication.service_name} — qty {i.quantity}
                  {i.dosage ? `, ${i.dosage}` : ""}
                  {i.instructions ? `, ${i.instructions}` : ""}
                </li>
              ))}
            </ul>
          </div>
          {prescription.notes ? (
            <div>
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{prescription.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionDetailsPage;
