-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "recurring_id" TEXT;

-- CreateTable
CREATE TABLE "recurring_appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "dentist_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "operatory_id" TEXT,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "procedure_type" TEXT NOT NULL,
    "notes" TEXT,
    "time_of_day" TEXT NOT NULL,
    "days_of_week" INTEGER[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_appointments_patient_id_idx" ON "recurring_appointments"("patient_id");

-- CreateIndex
CREATE INDEX "recurring_appointments_dentist_id_idx" ON "recurring_appointments"("dentist_id");

-- CreateIndex
CREATE INDEX "recurring_appointments_tenant_id_idx" ON "recurring_appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_appointments_is_active_idx" ON "recurring_appointments"("is_active");

-- CreateIndex
CREATE INDEX "appointments_recurring_id_idx" ON "appointments"("recurring_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
