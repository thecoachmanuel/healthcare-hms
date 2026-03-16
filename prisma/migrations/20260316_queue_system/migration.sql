DO $$ BEGIN
  CREATE TYPE "TriagePriority" AS ENUM ('RED','YELLOW','GREEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "IntakeType" AS ENUM ('WALK_IN','APPOINTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QueueStatus" AS ENUM ('WAITING','CALLED','IN_CONSULTATION','COMPLETED','SKIPPED','NO_SHOW','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "window_start" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "window_end" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Visit" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" TEXT NOT NULL,
  "doctor_id" TEXT,
  "department" TEXT,
  "intake_type" "IntakeType" NOT NULL,
  "appointment_id" INTEGER,
  "arrived_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "completed_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "created_by_role" "Role",
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "Visit_patient_id_idx" ON "Visit"("patient_id");
CREATE INDEX IF NOT EXISTS "Visit_doctor_id_idx" ON "Visit"("doctor_id");
CREATE INDEX IF NOT EXISTS "Visit_department_idx" ON "Visit"("department");
CREATE INDEX IF NOT EXISTS "Visit_arrived_at_idx" ON "Visit"("arrived_at");

CREATE TABLE IF NOT EXISTS "Triage" (
  "id" SERIAL PRIMARY KEY,
  "visit_id" INTEGER NOT NULL UNIQUE,
  "nurse_id" TEXT NOT NULL,
  "priority" "TriagePriority" NOT NULL,
  "notes" TEXT,
  "triaged_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "Triage" ADD CONSTRAINT "Triage_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "Triage" ADD CONSTRAINT "Triage_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "Staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "Triage_priority_idx" ON "Triage"("priority");
CREATE INDEX IF NOT EXISTS "Triage_triaged_at_idx" ON "Triage"("triaged_at");

CREATE TABLE IF NOT EXISTS "QueueTicket" (
  "id" SERIAL PRIMARY KEY,
  "visit_id" INTEGER NOT NULL UNIQUE,
  "queue_number" TEXT NOT NULL UNIQUE,
  "department" TEXT,
  "doctor_id" TEXT,
  "priority" "TriagePriority" NOT NULL DEFAULT 'GREEN',
  "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
  "arrival_time" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "called_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "skip_count" INTEGER NOT NULL DEFAULT 0,
  "no_show_marked" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "QueueTicket_waiting_idx" ON "QueueTicket"("status", "priority", "arrival_time");
CREATE INDEX IF NOT EXISTS "QueueTicket_doctor_waiting_idx" ON "QueueTicket"("doctor_id", "status", "priority", "arrival_time");
CREATE INDEX IF NOT EXISTS "QueueTicket_department_waiting_idx" ON "QueueTicket"("department", "status", "priority", "arrival_time");

CREATE TABLE IF NOT EXISTS "DoctorStatus" (
  "doctor_id" TEXT PRIMARY KEY,
  "is_available" BOOLEAN NOT NULL DEFAULT TRUE,
  "current_visit_id" INTEGER,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

ALTER TABLE "DoctorStatus" ADD CONSTRAINT "DoctorStatus_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "DoctorStatus" ADD CONSTRAINT "DoctorStatus_current_visit_id_fkey" FOREIGN KEY ("current_visit_id") REFERENCES "Visit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "DoctorStatus_is_available_idx" ON "DoctorStatus"("is_available");

