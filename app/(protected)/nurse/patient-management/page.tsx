import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { Users, CalendarClock, TestTube } from "lucide-react";
import Link from "next/link";
import React from "react";

const PatientManagementPage = async () => {
  await requireAuthUserId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalPatients, todaysAppointments, pendingLabTests] = await Promise.all([
    (db as any).patient.count(),
    (db as any).appointment.count({ where: { appointment_date: { gte: startOfDay } } }),
    (db as any).labTest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Patients"
          icon={Users}
          note="Total registered patients"
          value={totalPatients}
          link="/record/patients"
        />
        <StatCard
          title="Appointments Today"
          icon={CalendarClock}
          note="All appointments scheduled today"
          value={todaysAppointments}
          link="/record/appointments"
        />
        <StatCard
          title="Pending Lab Tests"
          icon={TestTube}
          note="Lab tests awaiting processing"
          value={pendingLabTests}
          link="/nurse/lab-tests"
        />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>View and manage assigned patients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Link className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 text-sm" href="/record/patients">
              Patient records
            </Link>
            <Link className="px-4 py-2 rounded-lg bg-violet-100 text-violet-600 text-sm" href="/record/appointments">
              Appointments
            </Link>
            <Link className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm" href="/nurse/lab-tests">
              Lab tests
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            Use the links above to manage patient records, view appointments, and monitor lab requests.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientManagementPage;
