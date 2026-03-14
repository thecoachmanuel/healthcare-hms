import db from "@/lib/db";
import { ReceptionistBookAppointment } from "./receptionist-book-appointment";
import { requireAuthUserId } from "@/lib/auth";

export async function ReceptionistAppointmentContainer() {
  const userId = await requireAuthUserId();
  const staff = await db.staff.findUnique({ where: { id: userId }, select: { department: true } });
  const dept = staff?.department?.trim() ?? "";

  const [patients, doctors] = await Promise.all([
    db.patient.findMany({ select: { id: true, first_name: true, last_name: true, img: true, hospital_number: true, colorCode: true }, orderBy: { last_name: "asc" }, take: 200 }),
    db.doctor.findMany({
      select: { id: true, name: true },
      where: dept.length > 0 ? ({ department: { contains: dept, mode: "insensitive" } } as any) : {},
      orderBy: { name: "asc" },
    }),
  ]);

  const patientOptions = patients.map((p: any) => ({ label: `${p.last_name} ${p.first_name}`.trim(), value: p.id, img: p.img, hospital_number: p.hospital_number, colorCode: p.colorCode }));
  const doctorOptions = doctors.map((d: any) => ({ label: d.name, value: d.id }));

  return <ReceptionistBookAppointment patients={patientOptions} doctors={doctorOptions} />;
}
