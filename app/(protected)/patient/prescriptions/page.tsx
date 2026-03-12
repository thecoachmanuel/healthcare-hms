import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

const PrescriptionsPage = async () => {
  const userId = await requireAuthUserId();

  const prescriptions = await db.prescription.findMany({
    where: { patient_id: userId },
    include: {
      doctor: { select: { name: true } },
      items: { include: { medication: { select: { id: true, service_name: true } } } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>Your prescribed medications and instructions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {prescriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No prescriptions yet.</p>
          ) : (
            prescriptions.map((p: any) => (
              <div key={p.id} className="border rounded-lg p-4 space-y-2 bg-white">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Doctor:</span> {p.doctor?.name}{" "}
                  <span className="ml-4 font-medium">Status:</span> {p.status}{" "}
                  <span className="ml-4 font-medium">Date:</span>{" "}
                  {format(p.created_at, "MMM d, yyyy")}
                </div>
                <ul className="list-disc pl-5 text-sm">
                  {p.items.map((i: any) => (
                    <li key={i.id}>
                      <Link className="text-blue-600 hover:underline" href={`/medications/${i.medication.id}`}>
                        {i.medication.service_name}
                      </Link>{" "}
                      — qty {i.quantity}
                      {i.dosage ? `, ${i.dosage}` : ""}
                      {i.instructions ? `, ${i.instructions}` : ""}
                    </li>
                  ))}
                </ul>
                {p.notes ? (
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">{p.notes}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionsPage;
