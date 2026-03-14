import db from "@/lib/db";
import React from "react";
import { MedicalHistory } from "./medical-history";
import Link from "next/link";
import { Button } from "./ui/button";

interface DataProps {
  id?: number | string;
  patientId: string;
  page?: number;
}

const PAGE_SIZE = 10;

export const MedicalHistoryContainer = async ({ id, patientId, page = 1 }: DataProps) => {
  void id;
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const [totalRecords, data] = await Promise.all([
    db.medicalRecords.count({ where: { patient_id: patientId } }),
    db.medicalRecords.findMany({
      where: { patient_id: patientId },
      include: {
        diagnosis: { include: { doctor: true }, orderBy: { created_at: "desc" } },
        lab_test: true,
      },
      orderBy: { created_at: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, totalRecords);

  const doctorIds = Array.from(new Set(data.map((r) => r.doctor_id).filter(Boolean)));
  const doctors =
    doctorIds.length > 0
      ? await db.doctor.findMany({
          where: { id: { in: doctorIds as string[] } },
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

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Showing {showingFrom}-{showingTo} of {totalRecords}
        </span>
        <div className="flex gap-2 items-center">
          {safePage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?cat=medical-history&page=${safePage - 1}`}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          <span className="px-2 py-1 text-gray-600">Page {safePage} of {totalPages}</span>
          {safePage < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?cat=medical-history&page=${safePage + 1}`}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
