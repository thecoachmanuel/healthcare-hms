import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import db from "@/lib/db";
import { format } from "date-fns";
import React from "react";

const RecordOfficerDashboardPage = async () => {
  await requireAuthUserId();
  const isAllowed = await checkRole("RECORD_OFFICER");
  if (!isAllowed) return null;

  const recentPatients = await db.patient.findMany({
    orderBy: { created_at: "desc" },
    take: 10,
    select: { id: true, first_name: true, last_name: true, created_at: true },
  });

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Record Officer</CardTitle>
            <CardDescription>Manage and keep track of patient records.</CardDescription>
          </div>
          <Link href="/patient/registration" className="text-blue-600 hover:underline text-sm">
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

