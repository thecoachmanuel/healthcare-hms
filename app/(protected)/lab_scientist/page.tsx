import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const LabScientistDashboardPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Lab Scientist Dashboard</CardTitle>
          <CardDescription>Manage lab tests and results.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">Coming soon.</CardContent>
      </Card>
    </div>
  );
};

export default LabScientistDashboardPage;
