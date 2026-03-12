import db from "@/lib/db";
import React from "react";
import { SiteSettingsForm } from "@/components/settings/site-settings-form";

export const SiteSettingsSection = async () => {
  const existing = await db.siteSettings.findFirst({ orderBy: { id: "asc" } });
  return <SiteSettingsForm initial={existing ?? null} />;
};
