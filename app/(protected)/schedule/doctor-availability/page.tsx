import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { DoctorAvailabilityCalendar } from "@/components/schedule/doctor-availability";

export default async function DoctorAvailabilityPage() {
  await requireAuthUserId();
  const doctors = await db.doctor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div className="p-6">
      <DoctorAvailabilityCalendar doctors={doctors} />
    </div>
  );
}

