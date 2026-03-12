import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { ClipboardList, Pill, Clock } from "lucide-react";
import React from "react";
import { RecordMedicationAdministration } from "@/components/dialogs/record-medication-administration";

const AdministerMedicationsPage = async () => {
  await requireAuthUserId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [dispensedTodayCount, administrationsTodayCount, dispensedPrescriptions] = await Promise.all([
      db.prescription.count({
        where: { status: "DISPENSED", updated_at: { gte: startOfDay } },
      }),
      db.medicationAdministration.count({ where: { administered_at: { gte: startOfDay } } }),
      db.prescription.findMany({
        where: { status: "DISPENSED" },
        include: {
          patient: {
            select: { first_name: true, last_name: true, hospital_number: true },
          },
          doctor: { select: { name: true } },
          items: {
            include: {
              medication: { select: { service_name: true } },
              administrations: {
                select: {
                  id: true,
                  quantity: true,
                  administered_at: true,
                  nurse: { select: { name: true } },
                },
                orderBy: { administered_at: "desc" },
              },
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: 20,
      }),
    ]);

  const ready = dispensedPrescriptions.filter((p) =>
    p.items.some((i) => {
      const administered = (i.administrations ?? []).reduce(
        (sum, a) => sum + (a.quantity ?? 0),
        0
      );
      return i.quantity - administered > 0;
    })
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Ready to Administer"
          icon={ClipboardList}
          note="Dispensed with remaining doses"
          value={ready.length}
          link="/nurse/administer-medications"
        />
        <StatCard
          title="Dispensed Today"
          icon={Pill}
          note="Dispensed prescriptions today"
          value={dispensedTodayCount}
          link="/pharmacist/prescriptions?status=DISPENSED"
          iconClassName="text-emerald-600"
        />
        <StatCard
          title="Administrations Today"
          icon={Clock}
          note="Recorded administrations today"
          value={administrationsTodayCount}
          link="/nurse/administer-medications"
        />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Administer Medications</CardTitle>
          <CardDescription>Record and track medication administration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Ready for administration</h3>
              <p className="text-sm text-gray-500">Administer remaining doses for dispensed prescriptions.</p>
            </div>
            <div className="divide-y">
              {ready.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No dispensed prescriptions with remaining doses.</div>
              ) : (
                ready.map((p) => {
                  const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
                  return (
                    <div key={p.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-medium uppercase">{patientName}</div>
                        <div className="text-gray-600">
                          <span className="font-medium">Doctor:</span> {p.doctor?.name ?? "—"}
                          <span className="ml-4 font-medium">Status:</span> {p.status}
                          {p.patient?.hospital_number ? (
                            <span className="ml-4 text-xs text-gray-500">{p.patient.hospital_number}</span>
                          ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                          {p.items.map((i) => {
                            const administered = (i.administrations ?? []).reduce(
                              (sum, a) => sum + (a.quantity ?? 0),
                              0
                            );
                            const remaining = Math.max(0, i.quantity - administered);
                            if (remaining <= 0) return null;
                            return (
                              <div key={i.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border rounded-md px-3 py-2">
                                <div className="text-sm">
                                  <div className="font-medium">{i.medication?.service_name ?? "Medication"}</div>
                                  <div className="text-xs text-gray-500">
                                    Administered {administered}/{i.quantity} • Remaining {remaining}
                                  </div>
                                </div>
                                <RecordMedicationAdministration
                                  prescriptionItemId={i.id}
                                  patientId={p.patient_id}
                                  medicationName={i.medication?.service_name ?? "Medication"}
                                  remaining={remaining}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {p.appointment_id ? (
                        <Link
                          className="text-blue-600 hover:underline text-sm"
                          href={`/record/appointments/${p.appointment_id}?cat=prescriptions`}
                        >
                          Open appointment
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">No appointment linked</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdministerMedicationsPage;
