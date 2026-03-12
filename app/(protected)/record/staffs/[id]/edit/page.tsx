import { EditStaffForm } from "@/components/forms/edit-staff-form";
import { Card } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import React from "react";

const EditStaffPage = async (props: { params: Promise<{ id: string }> }) => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) return null;

  const params = await props.params;
  const staff = await db.staff.findUnique({ where: { id: params.id } });
  if (!staff) return null;

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl p-6">
        <h1 className="text-xl font-semibold">Edit Staff</h1>
        <EditStaffForm staff={staff} />
      </Card>
    </div>
  );
};

export default EditStaffPage;

