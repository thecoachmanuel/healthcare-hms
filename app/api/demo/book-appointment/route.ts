import { NextResponse } from "next/server";
import { demoBookAppointmentAndCreateBill } from "@/app/actions/demo";

export async function POST() {
  const res = await demoBookAppointmentAndCreateBill();
  return NextResponse.json(res, { status: res.success ? 200 : 401 });
}

