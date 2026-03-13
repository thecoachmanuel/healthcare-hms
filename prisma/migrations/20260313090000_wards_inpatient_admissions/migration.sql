DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdmissionStatus') THEN
    CREATE TYPE "AdmissionStatus" AS ENUM ('ADMITTED', 'DISCHARGED', 'TRANSFERRED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Ward" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ward_name_key" ON "Ward"("name");

ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "ward_id" INTEGER;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "ward_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_ward_id_fkey') THEN
    ALTER TABLE "Staff" ADD CONSTRAINT "Staff_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Doctor_ward_id_fkey') THEN
    ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "InpatientAdmission" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "attending_doctor_id" TEXT,
    "admitted_by_id" TEXT,
    "admitted_by_role" "Role",
    "status" "AdmissionStatus" NOT NULL DEFAULT 'ADMITTED',
    "admitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharged_at" TIMESTAMP(3),
    "discharge_notes" TEXT,
    "discharged_by_id" TEXT,
    "discharged_by_role" "Role",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InpatientAdmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InpatientAdmission_patient_id_idx" ON "InpatientAdmission"("patient_id");
CREATE INDEX IF NOT EXISTS "InpatientAdmission_ward_id_idx" ON "InpatientAdmission"("ward_id");
CREATE INDEX IF NOT EXISTS "InpatientAdmission_status_idx" ON "InpatientAdmission"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InpatientAdmission_patient_id_fkey') THEN
    ALTER TABLE "InpatientAdmission" ADD CONSTRAINT "InpatientAdmission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InpatientAdmission_ward_id_fkey') THEN
    ALTER TABLE "InpatientAdmission" ADD CONSTRAINT "InpatientAdmission_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InpatientAdmission_attending_doctor_id_fkey') THEN
    ALTER TABLE "InpatientAdmission" ADD CONSTRAINT "InpatientAdmission_attending_doctor_id_fkey" FOREIGN KEY ("attending_doctor_id") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

