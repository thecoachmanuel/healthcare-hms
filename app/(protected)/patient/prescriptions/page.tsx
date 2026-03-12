import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const PrescriptionsPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>Your prescribed medications and instructions.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">Coming soon.</CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionsPage;
