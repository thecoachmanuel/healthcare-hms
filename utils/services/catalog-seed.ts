import db from "@/lib/db";
import { SPECIALIZATION } from "@/utils/seetings";

const DEFAULT_LAB_UNITS = [
  "Hematology",
  "Histopathology",
  "Chemical Pathology",
  "Blood Transfusion Service",
  "Medical Microbiology",
  "VCT",
  "Chest Clinic",
  "Donor Clinic",
];

export async function ensureDefaultLabUnits() {
  const count = await db.labUnit.count();
  if (count > 0) return;
  await db.labUnit.createMany({
    data: DEFAULT_LAB_UNITS.map((name) => ({ name, active: true })),
    skipDuplicates: true,
  });
}

export async function ensureDefaultDoctorSpecializations() {
  const count = await db.doctorSpecialization.count();
  if (count > 0) return;

  await db.doctorSpecialization.createMany({
    data: SPECIALIZATION.map((s) => ({
      name: s.label,
      department: s.department,
      active: true,
    })),
    skipDuplicates: true,
  });
}

