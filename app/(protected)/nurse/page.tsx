import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const NurseDashboardPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Nurse Dashboard</CardTitle>
          <CardDescription>Manage patient care workflows.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          Use the sidebar to access nurse tools.
        </CardContent>
      </Card>
    </div>
  );
};

export default NurseDashboardPage;
