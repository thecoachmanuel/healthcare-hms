"use server";

import db from "@/lib/db";
import { WorkingDaysSchema } from "@/lib/schema";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

export async function updateMyWorkingDays(schedule: any) {
  try {
    const doctorId = await requireAuthUserId();
    const isDoctor = await checkRole("DOCTOR");
    const isAdmin = await checkRole("ADMIN");
    if (!isDoctor && !isAdmin) return { success: false, msg: "Unauthorized" };

    const parsed = WorkingDaysSchema.safeParse(schedule);
    if (!parsed.success) return { success: false, msg: "Invalid schedule" };
    const data = parsed.data ?? [];

    await db.$transaction([
      db.workingDays.deleteMany({ where: { doctor_id: doctorId } }),
      ...data.map((d) =>
        db.workingDays.create({ data: { ...d, doctor_id: doctorId } })
      ),
    ]);

    return { success: true, msg: "Availability updated" };
  } catch (e) {
    console.log(e);
    return { success: false, msg: "Internal Server Error" };
  }
}

