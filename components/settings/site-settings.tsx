import db from "@/lib/db";
import React from "react";
import { SiteSettingsForm } from "@/components/settings/site-settings-form";

export const SiteSettingsSection = async () => {
  let existing: any = null;
  try {
    existing = await (db as any).siteSettings.findFirst({ orderBy: { id: "asc" } });
  } catch {
    existing = null;
  }
  return <SiteSettingsForm initial={existing ?? null} />;
};
