import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import db from "@/lib/db";
import { format } from "date-fns";
import React from "react";
import { StatCard } from "@/components/stat-card";
import { Users, CalendarPlus, FileText } from "lucide-react";

const RecordOfficerDashboardPage = async () => {
  await requireAuthUserId();
  const isAllowed = await checkRole("RECORD_OFFICER");
  if (!isAllowed) return null;

  const [recentPatients, totalPatients, todayRegistrations, withAppointments] = await Promise.all([
    db.patient.findMany({
    orderBy: { created_at: "desc" },
    take: 10,
    select: { id: true, first_name: true, last_name: true, created_at: true },
    }),
    db.patient.count(),
    db.patient.count({ where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.appointment
      .findMany({ distinct: ["patient_id"], select: { patient_id: true } })
      .then((rows) => rows.length),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <StatCard title="Patients" icon={Users} note="Total registered" value={totalPatients} link="/record/patients" />
        <StatCard title="Registered Today" icon={CalendarPlus} note="New registrations today" value={todayRegistrations} link="/record/patients" />
        <StatCard title="With Appointments" icon={FileText} note="Patients with at least one appointment" value={withAppointments} link="/record/appointments" />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Record Officer</CardTitle>
            <CardDescription>Manage and keep track of patient records.</CardDescription>
          </div>
          <Link href="/patient/registration" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            Create New Patient
          </Link>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-3">
          <h3 className="font-semibold">Recent Patients</h3>
          <ul className="space-y-2">
            {recentPatients.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <Link href={`/patient/${p.id}`} className="hover:underline">
                  {p.first_name} {p.last_name}
                </Link>
                <span className="text-gray-500">{format(p.created_at, "yyyy-MM-dd")}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordOfficerDashboardPage;
