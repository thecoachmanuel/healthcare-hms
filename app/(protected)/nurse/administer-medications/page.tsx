import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { ClipboardList, Pill, Clock } from "lucide-react";
import React from "react";

const AdministerMedicationsPage = async () => {
  await requireAuthUserId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [issuedCount, dispensedTodayCount, medicationCount, recent] = await Promise.all([
    (db as any).prescription.count({ where: { status: "ISSUED" } }),
    (db as any).prescription.count({ where: { status: "DISPENSED", updated_at: { gte: startOfDay } } }),
    (db as any).services.count({ where: { category: "MEDICATION" } }),
    (db as any).prescription.findMany({
      where: { status: "ISSUED" },
      include: {
        patient: { select: { first_name: true, last_name: true, hospital_number: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Issued Prescriptions"
          icon={ClipboardList}
          note="Awaiting administration/dispensing"
          value={issuedCount}
          link="/record/appointments"
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
          title="Medication Catalog"
          icon={Clock}
          note="View medication details and history"
          value={medicationCount}
          link="/pharmacist/medications"
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
              <h3 className="font-semibold">Recent issued prescriptions</h3>
              <p className="text-sm text-gray-500">Open the appointment to view prescriptions.</p>
            </div>
            <div className="divide-y">
              {recent.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No issued prescriptions.</div>
              ) : (
                recent.map((p: any) => {
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
