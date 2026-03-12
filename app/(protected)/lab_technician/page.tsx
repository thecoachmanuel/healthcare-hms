import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
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
        <CardContent className="text-sm text-gray-500">Coming soon.</CardContent>
      </Card>
    </div>
  );
};

export default LabTechnicianDashboardPage;

