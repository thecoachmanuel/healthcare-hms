import db from "@/lib/db";
import React from "react";
import { MedicalHistory } from "./medical-history";

interface DataProps {
  id?: number | string;
  patientId: string;
}

export const MedicalHistoryContainer = async ({ id, patientId }: DataProps) => {
  void id;
  const data = await db.medicalRecords.findMany({
    where: { patient_id: patientId },
    include: {
      diagnosis: { include: { doctor: true }, orderBy: { created_at: "desc" } },
      lab_test: true,
    },

    orderBy: { created_at: "desc" },
  });

  const doctorIds = Array.from(
    new Set(data.map((r) => r.doctor_id).filter(Boolean))
  );

  const doctors =
    doctorIds.length > 0
      ? await db.doctor.findMany({
          where: { id: { in: doctorIds } },
          select: { id: true, name: true, specialization: true, img: true, colorCode: true },
        })
      : [];

  const doctorById = new Map(doctors.map((d) => [d.id, d]));
  const withPhysician = data.map((r) => ({
    ...r,
    physician: doctorById.get(r.doctor_id) ?? null,
  }));
  return (
    <>
      <MedicalHistory data={withPhysician as any} isShowProfile={false} />
    </>
  );
};
