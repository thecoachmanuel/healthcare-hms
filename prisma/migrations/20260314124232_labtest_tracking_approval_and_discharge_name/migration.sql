/*
  Warnings:

  - Changed the type of `status` on the `LabTest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LabTestStatus" AS ENUM ('REQUESTED', 'SAMPLE_COLLECTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'LAB_RECEPTIONIST';
ALTER TYPE "Role" ADD VALUE 'RECEPTIONIST';

-- AlterTable
ALTER TABLE "InpatientAdmission" ADD COLUMN     "discharged_by_name" TEXT;

-- AlterTable
ALTER TABLE "LabTest" ADD COLUMN     "analysis_completed_at" TIMESTAMP(3),
ADD COLUMN     "analysis_started_at" TIMESTAMP(3),
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "collected_at" TIMESTAMP(3),
ADD COLUMN     "received_at" TIMESTAMP(3),
ADD COLUMN     "sample_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "LabTestStatus" NOT NULL;

-- CreateTable
CREATE TABLE "HmoProvider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HmoProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HmoProvider_name_key" ON "HmoProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HmoProvider_code_key" ON "HmoProvider"("code");

-- CreateIndex
CREATE INDEX "LabTest_status_idx" ON "LabTest"("status");

-- CreateIndex
CREATE INDEX "LabTest_sample_id_idx" ON "LabTest"("sample_id");

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
