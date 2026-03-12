/*
  Warnings:

  - A unique constraint covering the columns `[hospital_number]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('NONE', 'INSURANCE', 'NHIA', 'WAIVER', 'OTHER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'RECORD_OFFICER';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "hospital_number" TEXT;

-- AlterTable
ALTER TABLE "PatientBills" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "coverage_notes" TEXT,
ADD COLUMN     "coverage_reference" TEXT,
ADD COLUMN     "coverage_type" "CoverageType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "payment_reason" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "homepage_text" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_hospital_number_key" ON "Patient"("hospital_number");
