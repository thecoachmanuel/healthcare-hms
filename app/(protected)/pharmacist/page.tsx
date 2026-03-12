import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { Pill, ClipboardList, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

const PharmacistDashboardPage = async () => {
  await requireAuthUserId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pendingPrescriptions, dispensedToday, medicationsCount, recent] = await Promise.all([
    (db as any).prescription.count({ where: { status: "ISSUED" } }),
    (db as any).prescription.count({
      where: { status: "DISPENSED", updated_at: { gte: startOfDay } },
    }),
    (db as any).services.count({ where: { category: "MEDICATION" } }),
    (db as any).prescription.findMany({
      include: {
        patient: { select: { first_name: true, last_name: true, hospital_number: true } },
        doctor: { select: { name: true } },
        items: { select: { id: true } },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Pending Prescriptions"
          icon={ClipboardList}
          note="Prescriptions awaiting dispensing"
          value={pendingPrescriptions}
          link="/pharmacist/prescriptions"
        />
        <StatCard
          title="Dispensed Today"
          icon={CheckCircle}
          note="Prescriptions dispensed today"
          value={dispensedToday}
          link="/pharmacist/prescriptions?status=DISPENSED"
          iconClassName="text-emerald-600"
        />
        <StatCard
          title="Medications"
          icon={Pill}
          note="Total medications in catalog"
          value={medicationsCount}
          link="/pharmacist/medications"
        />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Pharmacist Dashboard</CardTitle>
          <CardDescription>Manage prescriptions and medications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Link className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 text-sm" href="/pharmacist/prescriptions">
              View prescriptions
            </Link>
            <Link className="px-4 py-2 rounded-lg bg-rose-100 text-rose-600 text-sm" href="/pharmacist/medications">
              View medications
            </Link>
          </div>

          <div className="border rounded-lg bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Recent prescriptions</h3>
            </div>
            <div className="divide-y">
              {recent.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No prescriptions yet.</div>
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
                          <span className="ml-4 font-medium">Items:</span> {p.items?.length ?? 0}
                          {p.patient?.hospital_number ? (
                            <span className="ml-4 text-xs text-gray-500">{p.patient.hospital_number}</span>
                          ) : null}
                        </div>
                      </div>
                      <Link className="text-blue-600 hover:underline text-sm" href={`/pharmacist/prescriptions/${p.id}`}>
                        Open
                      </Link>
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

export default PharmacistDashboardPage;
