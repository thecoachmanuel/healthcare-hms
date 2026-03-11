import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const CashierDashboardPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Cashier Dashboard</CardTitle>
          <CardDescription>Manage billing and payments.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          Coming soon.
        </CardContent>
      </Card>
    </div>
  );
};

export default CashierDashboardPage;
