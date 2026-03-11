import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const PatientManagementPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>View and manage assigned patients.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          Coming soon.
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientManagementPage;
