import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await db.$queryRaw<any[]>`
    SELECT
      v.id,
      v.department,
      v.arrived_at,
      p.first_name AS patient_first_name,
      p.last_name AS patient_last_name,
      p.hospital_number AS patient_hospital_number,
      d.name AS doctor_name
    FROM "Visit" v
    JOIN "Patient" p ON p.id = v.patient_id
    LEFT JOIN "Doctor" d ON d.id = v.doctor_id
    LEFT JOIN "Triage" t ON t.visit_id = v.id
    WHERE t.id IS NULL
    ORDER BY v.arrived_at ASC
    LIMIT 50
  `;
  return NextResponse.json({ items: rows });
}
