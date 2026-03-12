import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import db from "@/lib/db";
import { MedicalHistoryCard } from "./appointment/medical-history-card";
import React from "react";
import { Diagnosis, Doctor } from "@prisma/client";

interface DataProps {
  id: string | number;
  patientId: string;
  medicalId?: string;
  doctor_id: string | number;
  label: React.ReactNode;
}
export const MedicalHistoryDialog = async ({
  id,
  patientId,
  label,
}: DataProps) => {
  const record = await db.medicalRecords.findFirst({
    where: { appointment_id: Number(id), patient_id: patientId },
    include: {
      diagnosis: { include: { doctor: true }, orderBy: { created_at: "desc" } },
    },
    orderBy: { created_at: "desc" },
  });

  const diagnosis =
    (record?.diagnosis as Array<Diagnosis & { doctor: Doctor }> | undefined) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center rounded-full bg-blue-600/10 hover:underline text-blue-600 px-1.5 py-1 text-xs md:text-sm"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90%] max-w-[425px] md:max-w-2xl 2xl:max-w-4xl p-8 overflow-y-auto">
        <div className="space-y-6">
          {diagnosis.length === 0 ? (
            <p className="text-sm text-gray-500">No diagnosis found.</p>
          ) : (
            diagnosis.map((d, index) => (
              <MedicalHistoryCard key={d.id} record={d} index={index} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
