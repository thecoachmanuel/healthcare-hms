import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json({ items: [] });

  const items = await db.patient.findMany({
    where: {
      OR: [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { hospital_number: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, first_name: true, last_name: true, hospital_number: true, phone: true },
    orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    take: 10,
  });

  return NextResponse.json({ items });
}
