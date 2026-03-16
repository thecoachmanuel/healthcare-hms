import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });
  const status = await db.doctorStatus.findUnique({ where: { doctor_id: doctorId } });
  return NextResponse.json(status ?? { doctor_id: doctorId, is_available: true, current_visit_id: null });
}

