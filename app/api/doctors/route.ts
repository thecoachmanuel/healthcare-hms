import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = (searchParams.get("department") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (department.length > 0) {
    where.department = { contains: department, mode: "insensitive" };
  }
  if (q.length > 0) {
    where.name = { contains: q, mode: "insensitive" };
  }

  const items = await db.doctor.findMany({
    where,
    select: { id: true, name: true, department: true },
    orderBy: [{ name: "asc" }],
    take: 50,
  });

  return NextResponse.json({ items });
}

