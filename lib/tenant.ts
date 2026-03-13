import { headers } from "next/headers";

import db, { resolveHospitalIdFromRequest } from "@/lib/db";

function safeLowerHost(host: string) {
  const raw = host.trim();
  if (!raw) return "";
  return raw.split(":")[0].toLowerCase();
}

export async function getTenantHost() {
  try {
    const h = await headers();
    return safeLowerHost(
      h.get("x-tenant-host") ?? h.get("x-forwarded-host") ?? h.get("host") ?? ""
    );
  } catch {
    return "";
  }
}

export async function getCurrentHospital() {
  const hospitalId = await resolveHospitalIdFromRequest();
  return db.hospital.findFirst({
    where: { id: hospitalId, active: true },
    select: { id: true, name: true, slug: true, active: true },
  });
}
