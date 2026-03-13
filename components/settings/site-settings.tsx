import db from "@/lib/db";
import React from "react";
import { SiteSettingsForm } from "@/components/settings/site-settings-form";
import { resolveHospitalIdFromRequest } from "@/lib/db";

export const SiteSettingsSection = async () => {
  let existing: any = null;
  let hospital: { id: number; name: string; slug: string } | null = null;
  try {
    existing = await db.siteSettings.findFirst({ orderBy: { id: "asc" } });
  } catch {
    existing = null;
  }

  try {
    const hospitalId = await resolveHospitalIdFromRequest();
    hospital = await db.hospital.findFirst({ where: { id: hospitalId }, select: { id: true, name: true, slug: true } });
  } catch {
    hospital = null;
  }

  return <SiteSettingsForm initial={existing ?? null} hospital={hospital} />;
};
