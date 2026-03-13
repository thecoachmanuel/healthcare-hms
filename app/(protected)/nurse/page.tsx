import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { Users, CalendarClock, BedDouble } from "lucide-react";
import Link from "next/link";
import React from "react";

const NurseDashboardPage = async () => {
  const userId = await requireAuthUserId();
  const staff = await db.staff.findUnique({ where: { id: userId }, select: { department: true } });
  const dept = staff?.department?.trim() ?? "";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [patientsCount, todaysAppointments, admittedCount] = await Promise.all(
    dept.length > 0
      ? [
          db.appointment
            .findMany({ where: { doctor: { department: { contains: dept, mode: "insensitive" } } }, distinct: ["patient_id"], select: { patient_id: true } })
            .then((rows) => rows.length),
          db.appointment.count({ where: { appointment_date: { gte: startOfDay }, doctor: { department: { contains: dept, mode: "insensitive" } } } }),
          db.inpatientAdmission.count({ where: { status: "ADMITTED", ward: { department: { contains: dept, mode: "insensitive" } } } }),
        ]
      : [
          (db as any).patient.count(),
          (db as any).appointment.count({ where: { appointment_date: { gte: startOfDay } } }),
          (db as any).inpatientAdmission.count({ where: { status: "ADMITTED" } }),
        ]
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard title="Patients" icon={Users} note={dept.length > 0 ? `Patients in ${dept}` : "Total patients"} value={patientsCount} link="/record/patients" />
        <StatCard title="Appointments Today" icon={CalendarClock} note={dept.length > 0 ? `Today's in ${dept}` : "All departments"} value={todaysAppointments} link={dept.length > 0 ? `/record/appointments?department=${encodeURIComponent(dept)}` : "/record/appointments"} />
        <StatCard title="Inpatients" icon={BedDouble} note={dept.length > 0 ? `Admitted in ${dept}` : "Total admitted"} value={admittedCount} link="/record/appointments" />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Nursing Tools</CardTitle>
          <CardDescription>Quick access to common workflows.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Link className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 text-sm" href="/nurse/patient-management">
            Patient management
          </Link>
          <Link className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm" href="/nurse/lab-tests">
            Lab tests
          </Link>
          <Link className="px-4 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm" href="/nurse/administer-medications">
            Administer medications
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NurseDashboardPage;
