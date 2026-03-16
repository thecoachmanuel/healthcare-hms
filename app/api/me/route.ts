import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const [staff, doctor] = await Promise.all([
    db.staff.findUnique({ where: { id: user.id }, select: { role: true, department: true } }),
    db.doctor.findUnique({ where: { id: user.id }, select: { id: true, department: true } }),
  ]);

  const role = (user.app_metadata as any)?.role
    ?? (staff?.role ? String(staff.role).toLowerCase() : (doctor ? "doctor" : "patient"));

  return NextResponse.json({
    id: user.id,
    role,
    department: staff?.department ?? doctor?.department ?? null,
  });
}

