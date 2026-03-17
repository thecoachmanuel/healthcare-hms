import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const doctorId = searchParams.get("doctorId");

  const where: string[] = ["qt.status = 'IN_CONSULTATION'"];
  const params: any[] = [];

  if (doctorId) {
    where.push("qt.doctor_id = $1");
    params.push(doctorId);
  } else if (department) {
    where.push("qt.department = $1");
    params.push(department);
  }

  const clause = where.join(" AND ");
  const sql = `
    SELECT
      qt.id,
      qt.visit_id,
      qt.queue_number,
      qt.department,
      qt.doctor_id,
      qt.priority,
      qt.status,
      qt.arrival_time,
      qt.started_at,
      v.patient_id,
      v.doctor_id AS visit_doctor_id,
      v.intake_type,
      v.appointment_id,
      p.first_name AS patient_first_name,
      p.last_name AS patient_last_name,
      p.hospital_number AS patient_hospital_number,
      d.name AS doctor_name
    FROM "QueueTicket" qt
    JOIN "Visit" v ON v.id = qt.visit_id
    JOIN "Patient" p ON p.id = v.patient_id
    LEFT JOIN "Doctor" d ON d.id = COALESCE(qt.doctor_id, v.doctor_id)
    WHERE ${clause}
    ORDER BY qt.started_at DESC NULLS LAST, qt.arrival_time DESC
    LIMIT 200
  `;

  const rows = await db.$queryRawUnsafe<any[]>(sql, ...params);
  return NextResponse.json({ tickets: rows });
}

