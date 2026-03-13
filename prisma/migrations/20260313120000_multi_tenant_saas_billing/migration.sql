DO $$ BEGIN
  CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentTransactionStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HospitalDomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Hospital" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Hospital_slug_key" ON "Hospital"("slug");

INSERT INTO "Hospital" ("id", "name", "slug", "active", "created_at", "updated_at")
VALUES (1, 'Main Hospital', 'main', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "HospitalDomain" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "HospitalDomainType" NOT NULL DEFAULT 'SUBDOMAIN',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalDomain_domain_key" ON "HospitalDomain"("domain");
CREATE INDEX IF NOT EXISTS "HospitalDomain_hospital_id_idx" ON "HospitalDomain"("hospital_id");

DO $$ BEGIN
  ALTER TABLE "HospitalDomain" ADD CONSTRAINT "HospitalDomain_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "monthly_price_kobo" INTEGER NOT NULL,
    "yearly_price_kobo" INTEGER NOT NULL,
    "max_admins" INTEGER NOT NULL,
    "max_staff" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Plan_name_key" ON "Plan"("name");

INSERT INTO "Plan" ("name", "currency", "monthly_price_kobo", "yearly_price_kobo", "max_admins", "max_staff", "active", "created_at", "updated_at")
VALUES
  ('Starter', 'NGN', 1500000, 15000000, 1, 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Growth',  'NGN', 4500000, 45000000, 3, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Enterprise', 'NGN', 12000000, 120000000, 10, 300, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "paystack_customer_code" TEXT,
    "paystack_subscription_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Subscription_hospital_id_idx" ON "Subscription"("hospital_id");
CREATE INDEX IF NOT EXISTS "Subscription_plan_id_idx" ON "Subscription"("plan_id");

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "subscription_id" INTEGER,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
    "reference" TEXT NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_hospital_id_idx" ON "PaymentTransaction"("hospital_id");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_subscription_id_idx" ON "PaymentTransaction"("subscription_id");

DO $$ BEGIN
  ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "WorkingDays" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "InpatientAdmission" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PatientBills" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "LabTest" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "LabUnit" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MedicalRecords" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "VitalSigns" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Diagnosis" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Rating" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Services" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DoctorSpecialization" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MedicationAdministration" ADD COLUMN IF NOT EXISTS "hospital_id" INTEGER NOT NULL DEFAULT 1;

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "WorkingDays" ADD CONSTRAINT "WorkingDays_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Ward" ADD CONSTRAINT "Ward_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "InpatientAdmission" ADD CONSTRAINT "InpatientAdmission_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Department" ADD CONSTRAINT "Department_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PatientBills" ADD CONSTRAINT "PatientBills_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "LabUnit" ADD CONSTRAINT "LabUnit_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Rating" ADD CONSTRAINT "Rating_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Services" ADD CONSTRAINT "Services_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "DoctorSpecialization" ADD CONSTRAINT "DoctorSpecialization_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Patient_hospital_id_idx" ON "Patient"("hospital_id");
CREATE INDEX IF NOT EXISTS "Doctor_hospital_id_idx" ON "Doctor"("hospital_id");
CREATE INDEX IF NOT EXISTS "WorkingDays_hospital_id_idx" ON "WorkingDays"("hospital_id");
CREATE INDEX IF NOT EXISTS "Staff_hospital_id_idx" ON "Staff"("hospital_id");
CREATE INDEX IF NOT EXISTS "Ward_hospital_id_idx" ON "Ward"("hospital_id");
CREATE INDEX IF NOT EXISTS "InpatientAdmission_hospital_id_idx" ON "InpatientAdmission"("hospital_id");
CREATE INDEX IF NOT EXISTS "Department_hospital_id_idx" ON "Department"("hospital_id");
CREATE INDEX IF NOT EXISTS "Appointment_hospital_id_idx" ON "Appointment"("hospital_id");
CREATE INDEX IF NOT EXISTS "Payment_hospital_id_idx" ON "Payment"("hospital_id");
CREATE INDEX IF NOT EXISTS "PatientBills_hospital_id_idx" ON "PatientBills"("hospital_id");
CREATE INDEX IF NOT EXISTS "LabTest_hospital_id_idx" ON "LabTest"("hospital_id");
CREATE INDEX IF NOT EXISTS "LabUnit_hospital_id_idx" ON "LabUnit"("hospital_id");
CREATE INDEX IF NOT EXISTS "MedicalRecords_hospital_id_idx" ON "MedicalRecords"("hospital_id");
CREATE INDEX IF NOT EXISTS "VitalSigns_hospital_id_idx" ON "VitalSigns"("hospital_id");
CREATE INDEX IF NOT EXISTS "Diagnosis_hospital_id_idx" ON "Diagnosis"("hospital_id");
CREATE INDEX IF NOT EXISTS "AuditLog_hospital_id_idx" ON "AuditLog"("hospital_id");
CREATE INDEX IF NOT EXISTS "Notification_hospital_id_idx" ON "Notification"("hospital_id");
CREATE INDEX IF NOT EXISTS "SiteSettings_hospital_id_idx" ON "SiteSettings"("hospital_id");
CREATE INDEX IF NOT EXISTS "Rating_hospital_id_idx" ON "Rating"("hospital_id");
CREATE INDEX IF NOT EXISTS "Services_hospital_id_idx" ON "Services"("hospital_id");
CREATE INDEX IF NOT EXISTS "DoctorSpecialization_hospital_id_idx" ON "DoctorSpecialization"("hospital_id");
CREATE INDEX IF NOT EXISTS "Prescription_hospital_id_idx" ON "Prescription"("hospital_id");
CREATE INDEX IF NOT EXISTS "PrescriptionItem_hospital_id_idx" ON "PrescriptionItem"("hospital_id");
CREATE INDEX IF NOT EXISTS "MedicationAdministration_hospital_id_idx" ON "MedicationAdministration"("hospital_id");

DROP INDEX IF EXISTS "Ward_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Ward_hospital_id_name_key" ON "Ward"("hospital_id", "name");

DROP INDEX IF EXISTS "Department_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Department_hospital_id_name_key" ON "Department"("hospital_id", "name");

DROP INDEX IF EXISTS "LabUnit_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "LabUnit_hospital_id_name_key" ON "LabUnit"("hospital_id", "name");

DROP INDEX IF EXISTS "DoctorSpecialization_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorSpecialization_hospital_id_name_key" ON "DoctorSpecialization"("hospital_id", "name");

DROP INDEX IF EXISTS "Patient_hospital_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_hospital_id_hospital_number_key" ON "Patient"("hospital_id", "hospital_number");

CREATE UNIQUE INDEX IF NOT EXISTS "SiteSettings_hospital_id_key" ON "SiteSettings"("hospital_id");
