import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import React from "react";

const LabTechnicianDashboardPage = async () => {
  const userId = await requireAuthUserId();
  const staff = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
  const unit = staff?.lab_unit_id
    ? await db.labUnit.findUnique({ where: { id: staff.lab_unit_id }, select: { name: true } })
    : null;

  const [catalogApprovedCount, pendingRequests, completedToday] = await Promise.all([
    db.services.count({ where: { category: "LAB_TEST" as any, approved: true, ...(staff?.lab_unit_id ? { lab_unit_id: staff.lab_unit_id } : {}) } }),
    db.labTest.count({ where: { services: { lab_unit_id: staff?.lab_unit_id || undefined } as any, status: { in: ["REQUESTED", "SAMPLE_COLLECTED", "RECEIVED"] as any } as any } }),
    db.labTest.count({ where: { services: { lab_unit_id: staff?.lab_unit_id || undefined } as any, status: "COMPLETED" as any, analysis_completed_at: { gte: new Date(new Date().toDateString()) } as any } }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lab Technician</h1>
          <p className="text-sm text-gray-600">Unit: <span className="font-medium">{unit?.name ?? "Not set"}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/lab_scientist/lab-tests" className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm">Lab Requests</Link>
          <Link href="/lab_scientist/catalog" className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Lab Catalog</Link>
          {!staff?.lab_unit_id && (
            <Link href="/lab_technician/unit" className="px-3 py-1.5 rounded-md border text-sm">Set My Unit</Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Catalog (Approved)</CardDescription><CardTitle className="text-2xl">{catalogApprovedCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Requests Pending</CardDescription><CardTitle className="text-2xl">{pendingRequests}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Completed Today</CardDescription><CardTitle className="text-2xl">{completedToday}</CardTitle></CardHeader></Card>
      </div>
    </div>
  );
};

export default LabTechnicianDashboardPage;
