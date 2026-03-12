-- AlterTable
ALTER TABLE "Services" ADD COLUMN     "lab_unit_id" INTEGER;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "lab_unit_id" INTEGER;

-- CreateTable
CREATE TABLE "LabUnit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSpecialization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabUnit_name_key" ON "LabUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSpecialization_name_key" ON "DoctorSpecialization"("name");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_lab_unit_id_fkey" FOREIGN KEY ("lab_unit_id") REFERENCES "LabUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Services" ADD CONSTRAINT "Services_lab_unit_id_fkey" FOREIGN KEY ("lab_unit_id") REFERENCES "LabUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
