/*
  Warnings:

  - The values [LAB_TECHNICIAN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[record_id,service_id]` on the table `LabTest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" RENAME VALUE 'LAB_TECHNICIAN' TO 'LAB_SCIENTIST';

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctor_id_fkey";

-- DropIndex
DROP INDEX "LabTest_service_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_record_id_service_id_key" ON "LabTest"("record_id", "service_id");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
