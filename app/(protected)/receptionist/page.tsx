import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import Link from "next/link";
import React from "react";

const ReceptionistDashboardPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Receptionist Dashboard</CardTitle>
          <CardDescription>Manage appointments and front desk workflows.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-4">
            <Link href="/record/appointments" className="text-blue-600 hover:underline">
              Appointments
            </Link>
            <Link href="/notifications" className="text-blue-600 hover:underline">
              Notifications
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionistDashboardPage;

