import { Roles } from "@/types/globals";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { cache } from "react";

function mapRoleToRoute(role: Roles) {
  const r = String(role);
  if (r === "LAB_SCIENTIST") return "lab_scientist";
  if (r === "LAB_TECHNICIAN") return "lab_technician";
  if (r === "RECORD_OFFICER") return "record_officer";
  return r.toLowerCase();
}

function normalizeRouteRole(role: string) {
  const r = role.trim().toLowerCase();
  if (r === "lab_scientist" || r === "lab scientist") return "lab_scientist";
  if (r === "lab_technician" || r === "lab technician") return "lab_technician";
  if (r === "record_officer" || r === "record officer") return "record_officer";
  return r;
}

export const getRole = cache(async () => {
  const user = await getAuthUser();
  if (!user) return "sign-in";

  const appRole =
    (user.app_metadata as { role?: string } | null | undefined)?.role ?? null;
  if (appRole) return normalizeRouteRole(appRole);

  try {
    const [staff, doctor] = await Promise.all([
      db.staff.findUnique({ where: { id: user.id }, select: { role: true } }),
      db.doctor.findUnique({ where: { id: user.id }, select: { id: true } }),
    ]);

    if (staff) return mapRoleToRoute(staff.role);
    if (doctor) return "doctor";

    return "patient";
  } catch {
    return "patient";
  }
});

export const checkRole = cache(async (role: Roles) => {
  const currentRole = await getRole();
  return currentRole === mapRoleToRoute(role);
});
