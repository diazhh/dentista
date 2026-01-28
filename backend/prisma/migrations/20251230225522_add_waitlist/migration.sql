-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'CONTACTED', 'SCHEDULED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "dentist_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "preferred_dates" TIMESTAMP(3)[],
    "preferred_times" TEXT[],
    "procedure_type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "contacted_at" TIMESTAMP(3),
    "scheduled_appointment_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_patient_id_idx" ON "waitlist"("patient_id");

-- CreateIndex
CREATE INDEX "waitlist_dentist_id_idx" ON "waitlist"("dentist_id");

-- CreateIndex
CREATE INDEX "waitlist_tenant_id_idx" ON "waitlist"("tenant_id");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_created_at_idx" ON "waitlist"("created_at");
