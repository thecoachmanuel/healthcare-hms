-- Add approval fields to Services for lab test catalog
ALTER TABLE "Services"
ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "approved_by_id" TEXT,
ADD COLUMN IF NOT EXISTS "approved_by_role" "Role",
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);

-- Helpful index for catalog queries by unit and approval
CREATE INDEX IF NOT EXISTS "Services_catalog_idx" ON "Services" ("category", "lab_unit_id", "approved");

