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

let labUnitsEnsured = false;
let doctorSpecializationsEnsured = false;
let departmentsEnsured = false;

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
