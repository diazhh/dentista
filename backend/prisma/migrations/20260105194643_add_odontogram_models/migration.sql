-- CreateEnum
CREATE TYPE "ToothCondition" AS ENUM ('HEALTHY', 'CAVITY', 'FILLED', 'CROWN', 'BRIDGE', 'IMPLANT', 'MISSING', 'EXTRACTION_NEEDED', 'ROOT_CANAL', 'FRACTURED', 'WORN', 'ABSCESS');

-- CreateEnum
CREATE TYPE "ToothSurface" AS ENUM ('OCCLUSAL', 'MESIAL', 'DISTAL', 'BUCCAL', 'LINGUAL', 'INCISAL');

-- CreateTable
CREATE TABLE "odontograms" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "dentist_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odontograms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odontogram_teeth" (
    "id" TEXT NOT NULL,
    "odontogram_id" TEXT NOT NULL,
    "tooth_number" INTEGER NOT NULL,
    "condition" "ToothCondition" NOT NULL,
    "surfaces" "ToothSurface"[],
    "notes" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odontogram_teeth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "odontograms_patient_id_idx" ON "odontograms"("patient_id");

-- CreateIndex
CREATE INDEX "odontograms_dentist_id_idx" ON "odontograms"("dentist_id");

-- CreateIndex
CREATE INDEX "odontograms_tenant_id_idx" ON "odontograms"("tenant_id");

-- CreateIndex
CREATE INDEX "odontograms_date_idx" ON "odontograms"("date");

-- CreateIndex
CREATE INDEX "odontogram_teeth_odontogram_id_idx" ON "odontogram_teeth"("odontogram_id");

-- CreateIndex
CREATE UNIQUE INDEX "odontogram_teeth_odontogram_id_tooth_number_key" ON "odontogram_teeth"("odontogram_id", "tooth_number");

-- AddForeignKey
ALTER TABLE "odontograms" ADD CONSTRAINT "odontograms_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograms" ADD CONSTRAINT "odontograms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontogram_teeth" ADD CONSTRAINT "odontogram_teeth_odontogram_id_fkey" FOREIGN KEY ("odontogram_id") REFERENCES "odontograms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
