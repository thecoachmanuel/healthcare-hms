import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { getRole } from "@/utils/roles";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

const MedicationDetailPage = async (props: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuthUserId();
  const params = await props.params;
  const role = await getRole();

  const medication: any = await (db as any).services.findUnique({
    where: { id: Number(params.id) },
    select: { id: true, service_name: true, description: true, price: true, category: true },
  });
  if (!medication || medication.category !== "MEDICATION") return null;

  if (role === "patient") {
    const allowed = await (db as any).prescriptionItem.count({
      where: { medication_id: medication.id, prescription: { patient_id: userId } },
    });
    if (!allowed) return null;
  }

  const prescriptionItems = await (db as any).prescriptionItem.findMany({
    where:
      role === "patient"
        ? { medication_id: medication.id, prescription: { patient_id: userId } }
        : { medication_id: medication.id },
    include: {
      prescription: {
        select: {
          id: true,
          status: true,
          created_at: true,
          patient: { select: { id: true, first_name: true, last_name: true, hospital_number: true } },
          doctor: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 25,
  });

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-none rounded-xl">
        <CardHeader>
          <CardTitle>{medication.service_name}</CardTitle>
          <CardDescription>Medication details and recent prescriptions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-3 bg-white">
              <span className="text-gray-500">Price</span>
              <p className="text-lg font-semibold">{Number(medication.price).toFixed(2)}</p>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <span className="text-gray-500">Medication ID</span>
              <p className="text-lg font-semibold">#{medication.id}</p>
            </div>
            <div className="border rounded-lg p-3 bg-white">
              <span className="text-gray-500">Total recent prescriptions</span>
              <p className="text-lg font-semibold">{prescriptionItems.length}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{medication.description}</p>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-3">Recent prescriptions</h3>
            {prescriptionItems.length === 0 ? (
              <p className="text-sm text-gray-500">No prescriptions found for this medication.</p>
            ) : (
              <div className="space-y-3">
                {prescriptionItems.map((pi: any) => {
                  const p = pi.prescription;
                  const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
                  return (
                    <div key={pi.id} className="border rounded-md p-3 text-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                        <div className="text-gray-700">
                          <span className="font-medium">Patient:</span> {patientName}
                          {p.patient?.hospital_number ? (
                            <span className="ml-2 text-xs text-gray-500">{p.patient.hospital_number}</span>
                          ) : null}
                          <span className="ml-4 font-medium">Doctor:</span> {p.doctor?.name ?? "—"}
                          <span className="ml-4 font-medium">Status:</span> {p.status}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{format(p.created_at, "yyyy-MM-dd")}</span>
                          {role !== "patient" && (
                            <Link className="text-blue-600 hover:underline text-sm" href={`/pharmacist/prescriptions/${p.id}`}>
                              Open prescription
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-gray-600">
                        <span className="font-medium">Qty:</span> {pi.quantity}
                        {pi.dosage ? <span className="ml-3"><span className="font-medium">Dosage:</span> {pi.dosage}</span> : null}
                        {pi.instructions ? <span className="ml-3"><span className="font-medium">Instructions:</span> {pi.instructions}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationDetailPage;
