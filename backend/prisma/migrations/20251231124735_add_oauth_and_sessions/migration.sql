/*
  Warnings:

  - A unique constraint covering the columns `[document_id]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oauth_provider,oauth_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `document_id` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationFeeType" AS ENUM ('PERCENTAGE', 'FIXED', 'NONE');

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_fkey";

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "admin_user_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "floors" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "operatories" ADD COLUMN     "floor" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "document_id" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- Update existing patients with default values
UPDATE "patients" SET "document_id" = 'TEMP-' || "id", "phone" = '000-000-0000' WHERE "document_id" IS NULL;

-- Make columns required after data migration
ALTER TABLE "patients" ALTER COLUMN "document_id" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "cancellation_fee_amount" DOUBLE PRECISION,
ADD COLUMN     "cancellation_fee_type" TEXT,
ADD COLUMN     "cancellation_min_hours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "max_cancellations_per_month" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauth_id" TEXT,
ADD COLUMN     "oauth_provider" TEXT;

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_idx" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "patients_document_id_key" ON "patients"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_provider_oauth_id_key" ON "users"("oauth_provider", "oauth_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
