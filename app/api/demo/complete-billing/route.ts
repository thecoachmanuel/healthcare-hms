import { NextResponse } from "next/server";
import { demoCompleteLatestBill } from "@/app/actions/demo";

export async function POST() {
  const res = await demoCompleteLatestBill();
  return NextResponse.json(res, { status: res.success ? 200 : 401 });
}

