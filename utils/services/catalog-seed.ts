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

const DEFAULT_DEPARTMENTS = [
  "Accident & Emergency",
  "Outpatient",
  "Inpatient Ward",
  "Pediatrics",
  "Maternity",
  "Surgery",
  "ICU",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "Medical Records",
];

const DEFAULT_WARDS = [
  { name: "General Ward", department: "Inpatient Ward", capacity: 40 },
  { name: "Pediatrics Ward", department: "Pediatrics", capacity: 20 },
  { name: "Maternity Ward", department: "Maternity", capacity: 20 },
  { name: "Surgical Ward", department: "Surgery", capacity: 20 },
  { name: "ICU", department: "ICU", capacity: 10 },
];

let labUnitsEnsured = false;
let doctorSpecializationsEnsured = false;
let departmentsEnsured = false;
let wardsEnsured = false;

export async function ensureDefaultLabUnits() {
  if (labUnitsEnsured) return;
  const count = await db.labUnit.count();
  if (count > 0) return;
  await db.labUnit.createMany({
    data: DEFAULT_LAB_UNITS.map((name) => ({ name, active: true })),
    skipDuplicates: true,
  });
  labUnitsEnsured = true;
}

export async function ensureDefaultDoctorSpecializations() {
  if (doctorSpecializationsEnsured) return;
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
  doctorSpecializationsEnsured = true;
}

export async function ensureDefaultDepartments() {
  if (departmentsEnsured) return;
  const count = await db.department.count();
  if (count > 0) return;

  await db.department.createMany({
    data: DEFAULT_DEPARTMENTS.map((name) => ({ name, active: true })),
    skipDuplicates: true,
  });
  departmentsEnsured = true;
}

export async function ensureDefaultWards() {
  if (wardsEnsured) return;
  try {
    const count = await db.ward.count();
    if (count > 0) return;

    await db.ward.createMany({
      data: DEFAULT_WARDS.map((w) => ({ name: w.name, department: w.department, capacity: w.capacity, active: true })),
      skipDuplicates: true,
    });

    wardsEnsured = true;
  } catch {
    return;
  }
}
