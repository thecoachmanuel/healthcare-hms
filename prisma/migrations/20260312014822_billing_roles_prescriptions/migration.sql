-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('GENERAL', 'LAB_TEST', 'MEDICATION');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ISSUED', 'DISPENSED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'LAB_TECHNICIAN';
ALTER TYPE "Role" ADD VALUE 'PHARMACIST';

-- AlterTable
ALTER TABLE "PatientBills" ADD COLUMN     "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "issued_by_id" TEXT,
ADD COLUMN     "issued_by_role" "Role",
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "category" "ServiceCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "created_by_role" "Role";

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" INTEGER,
    "notes" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ISSUED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" SERIAL NOT NULL,
    "prescription_id" INTEGER NOT NULL,
    "medication_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dosage" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescription_id_idx" ON "PrescriptionItem"("prescription_id");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medication_id_idx" ON "PrescriptionItem"("medication_id");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "Services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
