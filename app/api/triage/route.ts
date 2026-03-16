import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await db.$queryRaw<any[]>`
    SELECT v.id, v.department, v.arrived_at
    FROM "Visit" v
    LEFT JOIN "Triage" t ON t.visit_id = v.id
    WHERE t.id IS NULL
    ORDER BY v.arrived_at ASC
    LIMIT 50
  `;
  return NextResponse.json({ items: rows });
}

