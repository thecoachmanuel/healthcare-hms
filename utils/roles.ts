import { Roles } from "@/types/globals";
import db from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";

function mapRoleToRoute(role: Roles) {
  if (role === "LAB_TECHNICIAN") return "lab_scientist";
  return role.toLowerCase();
}

export const checkRole = async (role: Roles) => {
  const currentRole = await getRole();
  return currentRole === mapRoleToRoute(role);
};

export const getRole = async () => {
  const userId = await getAuthUserId();
  if (!userId) return "sign-in";

  const [staff, doctor] = await Promise.all([
    db.staff.findUnique({ where: { id: userId }, select: { role: true } }),
    db.doctor.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  if (staff) return mapRoleToRoute(staff.role);
  if (doctor) return "doctor";

  return "patient";
};
