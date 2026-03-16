import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const where: any = {
    appointment_date: { gte: start, lte: end },
    status: { in: ["PENDING", "SCHEDULED"] },
  };
  if (department) {
    where.doctor = { department: { contains: department, mode: "insensitive" } };
  }

  const appts = await db.appointment.findMany({
    where,
    select: {
      id: true,
      patient_id: true,
      doctor_id: true,
      appointment_date: true,
      time: true,
      window_start: true,
      window_end: true,
      type: true,
    },
    orderBy: [{ appointment_date: "asc" }, { time: "asc" }],
    take: 200,
  });

  return NextResponse.json({ items: appts });
}

