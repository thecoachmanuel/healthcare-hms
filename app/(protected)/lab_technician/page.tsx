import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import Link from "next/link";
import React from "react";

const LabTechnicianDashboardPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Lab Technician Dashboard</CardTitle>
          <CardDescription>Manage lab requests and billing entries.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-4">
            <Link href="/lab_scientist/lab-tests" className="text-blue-600 hover:underline">
              View Lab Requests
            </Link>
            <Link href="/lab_technician/unit" className="text-blue-600 hover:underline">
              Set My Unit
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabTechnicianDashboardPage;
