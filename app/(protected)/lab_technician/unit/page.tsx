import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import React from "react";
import { LabUnitSelector } from "@/components/forms/lab-unit-selector";
import { ensureDefaultLabUnits } from "@/utils/services/catalog-seed";

const LabTechnicianUnitPage = async () => {
  const userId = await requireAuthUserId();
  const isAllowed = (await checkRole("LAB_TECHNICIAN")) || (await checkRole("LAB_RECEPTIONIST"));
  if (!isAllowed) return null;

  await ensureDefaultLabUnits();
  const [staff, units] = await Promise.all([
    db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } }),
    db.labUnit.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl">
        <CardHeader>
          <CardTitle>Lab Unit</CardTitle>
          <CardDescription>Select the unit you currently work in.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabUnitSelector
            currentUnitId={staff?.lab_unit_id ? String(staff.lab_unit_id) : ""}
            units={units.map((u: any) => ({ label: u.name, value: String(u.id) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LabTechnicianUnitPage;
