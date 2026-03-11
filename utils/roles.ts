import { Roles } from "@/types/globals";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

function mapRoleToRoute(role: Roles) {
  if (role === "LAB_TECHNICIAN") return "lab_scientist";
  return role.toLowerCase();
}

function normalizeRouteRole(role: string) {
  const r = role.trim().toLowerCase();
  if (r === "lab_technician" || r === "lab technician") return "lab_scientist";
  if (r === "lab_scientist" || r === "lab scientist") return "lab_scientist";
  return r;
}

export const checkRole = async (role: Roles) => {
  const currentRole = await getRole();
  return currentRole === mapRoleToRoute(role);
};

export const getRole = async () => {
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
};
