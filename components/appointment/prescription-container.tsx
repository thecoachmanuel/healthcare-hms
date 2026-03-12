import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreatePrescription } from "../dialogs/create-prescription";
import { MarkPrescriptionDispensed } from "../dialogs/mark-prescription-dispensed";
import Link from "next/link";

export const PrescriptionContainer = async ({
  appointmentId,
  patientId,
}: {
  appointmentId: string;
  patientId: string;
}) => {
  const isDoctor = await checkRole("DOCTOR");
  const canDispense = (await checkRole("ADMIN")) || (await checkRole("PHARMACIST"));

  const [prescriptions, medications] = await Promise.all([
    db.prescription.findMany({
      where: { appointment_id: Number(appointmentId) },
      include: {
        items: {
          include: { medication: { select: { id: true, service_name: true } } },
        },
        doctor: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    isDoctor
      ? db.services.findMany({
          where: { category: "MEDICATION" },
          select: { id: true, service_name: true },
          orderBy: { service_name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const medicationOptions = medications.map((m) => ({
    label: m.service_name,
    value: String(m.id),
  }));

  return (
    <Card className="shadow-none bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Prescriptions</CardTitle>
        {isDoctor && (
          <CreatePrescription
            appointmentId={appointmentId}
            patientId={patientId}
            medications={medicationOptions}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-500">No prescriptions for this appointment.</p>
        ) : (
          prescriptions.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Doctor:</span> {p.doctor?.name}{" "}
                  <span className="ml-4 font-medium">Status:</span> {p.status}
                </div>
                {canDispense && p.status !== "DISPENSED" && (
                  <MarkPrescriptionDispensed id={p.id} />
                )}
              </div>
              <ul className="list-disc pl-5 text-sm">
                {p.items.map((i) => (
                  <li key={i.id}>
                    {i.medication?.id ? (
                      <Link className="text-blue-600 hover:underline" href={`/medications/${i.medication.id}`}>
                        {i.medication?.service_name}
                      </Link>
                    ) : (
                      i.medication?.service_name
                    )}{" "}
                    — qty {i.quantity}
                    {i.dosage ? `, ${i.dosage}` : ""}
                    {i.instructions ? `, ${i.instructions}` : ""}
                  </li>
                ))}
              </ul>
              {p.notes ? <p className="text-sm text-gray-500">{p.notes}</p> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
