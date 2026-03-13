-- Align database with Prisma schema: trial_ends_at, max_patients, SaaSSettings

-- Add trial_ends_at to Hospital
ALTER TABLE "Hospital" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3);

-- Add max_patients to Plan with a safe default
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "max_patients" INTEGER NOT NULL DEFAULT 1000;

-- Create SaaSSettings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SaaSSettings" (
  "id" SERIAL PRIMARY KEY,
  "trial_days_default" INTEGER NOT NULL DEFAULT 30,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

