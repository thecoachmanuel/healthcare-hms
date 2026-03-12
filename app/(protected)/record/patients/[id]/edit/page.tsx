import { EditPatientForm } from "@/components/forms/edit-patient-form";
import { Card } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import React from "react";

const EditPatientPage = async (props: { params: Promise<{ id: string }> }) => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  const isRecordOfficer = await checkRole("RECORD_OFFICER");
  if (!isAdmin && !isRecordOfficer) return null;

  const params = await props.params;
  const patient = await db.patient.findUnique({ where: { id: params.id } });
  if (!patient) return null;

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-xl p-6">
        <h1 className="text-xl font-semibold">Edit Patient</h1>
        <EditPatientForm patient={patient} />
      </Card>
    </div>
  );
};

export default EditPatientPage;
