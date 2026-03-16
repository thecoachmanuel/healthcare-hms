import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const doctorId = searchParams.get("doctorId");
  const where = ["status = 'WAITING'"];
  const params: any[] = [];
  if (doctorId) {
    where.push("doctor_id = $1");
    params.push(doctorId);
  } else if (department) {
    where.push("department = $1");
    params.push(department);
  }
  const clause = where.join(" AND ");
  const sql = `
    SELECT id, visit_id, queue_number, department, doctor_id, priority, status, arrival_time
    FROM "QueueTicket"
    WHERE ${clause}
    ORDER BY CASE priority WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END ASC, arrival_time ASC
  `;
  const rows = await db.$queryRawUnsafe<any[]>(sql, ...params);
  return NextResponse.json({ tickets: rows });
}

