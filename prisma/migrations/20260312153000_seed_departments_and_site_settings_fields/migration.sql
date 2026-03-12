-- AddColumns
ALTER TABLE "SiteSettings" ADD COLUMN "site_title" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "homepage_title" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "homepage_subtitle" TEXT;

-- Seed Departments
INSERT INTO "Department" ("name", "active", "updated_at") VALUES
  ('Accident & Emergency', true, CURRENT_TIMESTAMP),
  ('Outpatient', true, CURRENT_TIMESTAMP),
  ('Inpatient Ward', true, CURRENT_TIMESTAMP),
  ('Pediatrics', true, CURRENT_TIMESTAMP),
  ('Maternity', true, CURRENT_TIMESTAMP),
  ('Surgery', true, CURRENT_TIMESTAMP),
  ('ICU', true, CURRENT_TIMESTAMP),
  ('Pharmacy', true, CURRENT_TIMESTAMP),
  ('Laboratory', true, CURRENT_TIMESTAMP),
  ('Radiology', true, CURRENT_TIMESTAMP),
  ('Medical Records', true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
