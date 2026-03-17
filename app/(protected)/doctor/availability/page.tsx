import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import { DoctorAvailabilityForm } from "@/components/forms/doctor-availability-form";

export default async function MyAvailabilityPage() {
  const userId = await requireAuthUserId();
  const roleDoctor = await checkRole("DOCTOR");
  const roleAdmin = await checkRole("ADMIN");
  if (!roleDoctor && !roleAdmin) return null;
  const doc = await db.doctor.findUnique({ where: { id: userId }, select: { working_days: true } });
  const schedule = (doc?.working_days ?? []).map((d: any) => ({
    day: String(d.day ?? "").toLowerCase(),
    start_time: String(d.start_time ?? "09:00"),
    close_time: String(d.close_time ?? "17:00"),
  }));
  return (
    <div className="p-6">
      <DoctorAvailabilityForm schedule={schedule as any} />
    </div>
  );
}
