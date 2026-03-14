import { NextResponse } from "next/server";
import { generateAppointmentReminders } from "@/app/actions/appointment";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hours = Number(url.searchParams.get("hours") ?? 24);
  const res = await generateAppointmentReminders(Number.isFinite(hours) && hours > 0 ? hours : 24);
  return NextResponse.json(res);
}

