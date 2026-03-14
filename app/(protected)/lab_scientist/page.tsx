import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import React from "react";

const LabScientistDashboardPage = async () => {
  const userId = await requireAuthUserId();
  const staff = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
  const unit = staff?.lab_unit_id
    ? await db.labUnit.findUnique({ where: { id: staff.lab_unit_id }, select: { name: true } })
    : null;

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Lab Scientist Dashboard</CardTitle>
          <CardDescription>Manage lab tests and results.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-4">
            <Link href="/lab_scientist/lab-tests" className="text-blue-600 hover:underline">
              View Lab Requests
            </Link>
            <Link href="/lab_scientist/catalog" className="text-blue-600 hover:underline">
              Lab Catalog
            </Link>
            {!staff?.lab_unit_id && (
              <Link href="/lab_scientist/unit" className="text-blue-600 hover:underline">
                Set My Unit
              </Link>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            Current Unit: <span className="font-medium">{unit?.name ?? "Not set"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabScientistDashboardPage;
