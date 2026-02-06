-- =====================================================================
-- Migration: Refactoring DentiCloud → MediCloud
-- Description: Renames dental-specific nomenclature, adds new enums,
--              new tables, and new columns for multi-discipline support.
-- =====================================================================

-- =============================================
-- PART 1: New Enums
-- =============================================

CREATE TYPE "MedicalSpecialty" AS ENUM (
  'GENERAL_DENTISTRY', 'ORTHODONTICS', 'ENDODONTICS', 'PERIODONTICS',
  'ORAL_SURGERY', 'PEDIATRIC_DENTISTRY', 'PROSTHODONTICS',
  'GENERAL_MEDICINE', 'INTERNAL_MEDICINE', 'PEDIATRICS',
  'CARDIOLOGY', 'DERMATOLOGY', 'OPHTHALMOLOGY', 'GYNECOLOGY',
  'PSYCHOLOGY', 'PSYCHIATRY', 'PHYSIOTHERAPY', 'NUTRITION',
  'SPEECH_THERAPY', 'OCCUPATIONAL_THERAPY', 'OTHER'
);

CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED');

CREATE TYPE "DataAccessLevel" AS ENUM ('FULL', 'CLINICAL_ONLY', 'SCHEDULING_ONLY', 'DOCUMENTS_SHARED', 'MINIMAL');

CREATE TYPE "ProviderPatientRelationType" AS ENUM ('REGISTERED_BY_PROVIDER', 'LINKED_BY_PATIENT', 'MUTUAL', 'PROVIDER_ONLY');

-- =============================================
-- PART 2: Update UserRole enum
-- NOTE: We need to recreate the enum because ALTER TYPE ADD VALUE
-- cannot be used in the same transaction as UPDATE statements.
-- =============================================

-- Recreate UserRole with new values
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PROVIDER', 'CLINIC_ADMIN', 'STAFF_MANAGER', 'STAFF_RECEPTIONIST', 'STAFF_BILLING', 'STAFF_ASSISTANT', 'PATIENT');

-- Drop defaults first to allow type change
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'DENTIST' THEN 'PROVIDER'::"UserRole"
    ELSE "role"::text::"UserRole"
  END
);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PATIENT'::"UserRole";

ALTER TABLE "tenant_memberships" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'DENTIST' THEN 'PROVIDER'::"UserRole"
    ELSE "role"::text::"UserRole"
  END
);

DROP TYPE "UserRole_old";

-- =============================================
-- PART 3: Rename Tables
-- =============================================

ALTER TABLE "patient_dentist_relations" RENAME TO "provider_patient_relations";
ALTER TABLE "dental_services" RENAME TO "medical_services";
ALTER TABLE "operatories" RENAME TO "consultation_rooms";
ALTER TABLE "operatory_assignments" RENAME TO "room_assignments";

-- =============================================
-- PART 4: Rename Columns (dentist_id → provider_id)
-- =============================================

-- provider_patient_relations (formerly patient_dentist_relations)
ALTER TABLE "provider_patient_relations" RENAME COLUMN "dentist_id" TO "provider_id";
ALTER TABLE "provider_patient_relations" RENAME COLUMN "notes" TO "provider_notes";

-- appointments
ALTER TABLE "appointments" RENAME COLUMN "dentist_id" TO "provider_id";
ALTER TABLE "appointments" RENAME COLUMN "operatory_id" TO "room_id";

-- recurring_appointments
ALTER TABLE "recurring_appointments" RENAME COLUMN "dentist_id" TO "provider_id";
ALTER TABLE "recurring_appointments" RENAME COLUMN "operatory_id" TO "room_id";

-- room_assignments (formerly operatory_assignments)
ALTER TABLE "room_assignments" RENAME COLUMN "operatory_id" TO "room_id";
ALTER TABLE "room_assignments" RENAME COLUMN "dentist_id" TO "provider_id";

-- treatment_plans
ALTER TABLE "treatment_plans" RENAME COLUMN "dentist_id" TO "provider_id";

-- invoices
ALTER TABLE "invoices" RENAME COLUMN "dentist_id" TO "provider_id";

-- documents
ALTER TABLE "documents" RENAME COLUMN "dentist_id" TO "provider_id";

-- odontograms
ALTER TABLE "odontograms" RENAME COLUMN "dentist_id" TO "provider_id";

-- waitlist
ALTER TABLE "waitlist" RENAME COLUMN "dentist_id" TO "provider_id";

-- chatbot_configs: rename clinic_* → practice_*
ALTER TABLE "chatbot_configs" RENAME COLUMN "clinic_name" TO "practice_name";
ALTER TABLE "chatbot_configs" RENAME COLUMN "clinic_address" TO "practice_address";
ALTER TABLE "chatbot_configs" RENAME COLUMN "clinic_phone" TO "practice_phone";
ALTER TABLE "chatbot_configs" RENAME COLUMN "clinic_website" TO "practice_website";

-- (PART 5: DENTIST → PROVIDER data migration handled in PART 2 via enum recreation)

-- =============================================
-- PART 6: Add new columns to existing tables
-- =============================================

-- Users: new fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "specialties" "MedicalSpecialty"[] DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'es';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo';

-- Drop old specialization column (replaced by specialties array)
ALTER TABLE "users" DROP COLUMN IF EXISTS "specialization";

-- Tenants: new practice_type field
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "practice_type" "MedicalSpecialty" NOT NULL DEFAULT 'GENERAL_DENTISTRY';

-- Patients: new fields
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "document_type" TEXT NOT NULL DEFAULT 'CEDULA';
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "address" JSONB;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "blood_type" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "chronic_conditions" TEXT[] DEFAULT '{}';
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_relation" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "default_data_access" "DataAccessLevel" NOT NULL DEFAULT 'MINIMAL';

-- Add unique constraint on patient document
CREATE UNIQUE INDEX IF NOT EXISTS "patients_document_type_document_id_key" ON "patients"("document_type", "document_id");

-- Provider Patient Relations: new fields
ALTER TABLE "provider_patient_relations" ADD COLUMN IF NOT EXISTS "relation_type" "ProviderPatientRelationType" NOT NULL DEFAULT 'REGISTERED_BY_PROVIDER';
ALTER TABLE "provider_patient_relations" ADD COLUMN IF NOT EXISTS "data_access_level" "DataAccessLevel" NOT NULL DEFAULT 'MINIMAL';
ALTER TABLE "provider_patient_relations" ADD COLUMN IF NOT EXISTS "local_medical_history" JSONB;
ALTER TABLE "provider_patient_relations" ADD COLUMN IF NOT EXISTS "local_allergies" TEXT[] DEFAULT '{}';
ALTER TABLE "provider_patient_relations" ADD COLUMN IF NOT EXISTS "local_medications" TEXT[] DEFAULT '{}';

-- Make provider_notes TEXT type (it was previously just text, ensure it allows long text)
-- Already renamed from notes, type is compatible

-- Clinics: new fields
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "tax_id" TEXT;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "business_hours" JSONB;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "specialties" "MedicalSpecialty"[] DEFAULT '{}';
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "amenities" TEXT[] DEFAULT '{}';
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "rental_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "rental_rate_hourly" DOUBLE PRECISION;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "rental_rate_daily" DOUBLE PRECISION;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "rental_rate_monthly" DOUBLE PRECISION;
ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT true;

-- Consultation Rooms: new fields
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "room_number" TEXT;
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "capabilities" TEXT[] DEFAULT '{}';
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "buffer_minutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "max_daily_hours" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "is_shared" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "consultation_rooms" ADD COLUMN IF NOT EXISTS "hourly_rate" DOUBLE PRECISION;

-- Room Assignments: new fields
ALTER TABLE "room_assignments" ADD COLUMN IF NOT EXISTS "assignment_type" TEXT NOT NULL DEFAULT 'RECURRING';
ALTER TABLE "room_assignments" ADD COLUMN IF NOT EXISTS "rental_rate" DOUBLE PRECISION;
ALTER TABLE "room_assignments" ADD COLUMN IF NOT EXISTS "rental_period" TEXT;

-- Medical Services (formerly dental_services): new fields
ALTER TABLE "medical_services" ADD COLUMN IF NOT EXISTS "specialty" "MedicalSpecialty" NOT NULL DEFAULT 'GENERAL_DENTISTRY';
ALTER TABLE "medical_services" ADD COLUMN IF NOT EXISTS "required_capabilities" TEXT[] DEFAULT '{}';
ALTER TABLE "medical_services" ADD COLUMN IF NOT EXISTS "requires_room" BOOLEAN NOT NULL DEFAULT true;

-- Add specialty index on medical_services
CREATE INDEX IF NOT EXISTS "medical_services_specialty_idx" ON "medical_services"("specialty");

-- =============================================
-- PART 7: New Tables
-- =============================================

-- Patient Consents
CREATE TABLE IF NOT EXISTS "patient_consents" (
  "id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "data_access_level" "DataAccessLevel" NOT NULL,
  "share_appointments" BOOLEAN NOT NULL DEFAULT true,
  "share_medical_history" BOOLEAN NOT NULL DEFAULT false,
  "share_documents" BOOLEAN NOT NULL DEFAULT false,
  "share_lab_results" BOOLEAN NOT NULL DEFAULT false,
  "share_billing" BOOLEAN NOT NULL DEFAULT false,
  "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
  "granted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "requested_by" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_consents_patient_id_idx" ON "patient_consents"("patient_id");
CREATE INDEX IF NOT EXISTS "patient_consents_provider_id_idx" ON "patient_consents"("provider_id");
CREATE INDEX IF NOT EXISTS "patient_consents_status_idx" ON "patient_consents"("status");
CREATE INDEX IF NOT EXISTS "patient_consents_expires_at_idx" ON "patient_consents"("expires_at");
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Shared Documents
CREATE TABLE IF NOT EXISTS "shared_documents" (
  "id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "shared_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shared_documents_document_id_provider_id_key" ON "shared_documents"("document_id", "provider_id");
CREATE INDEX IF NOT EXISTS "shared_documents_patient_id_idx" ON "shared_documents"("patient_id");
CREATE INDEX IF NOT EXISTS "shared_documents_provider_id_idx" ON "shared_documents"("provider_id");
CREATE INDEX IF NOT EXISTS "shared_documents_expires_at_idx" ON "shared_documents"("expires_at");
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Medical Exams
CREATE TABLE IF NOT EXISTS "medical_exams" (
  "id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "exam_type" TEXT NOT NULL,
  "description" TEXT,
  "exam_date" TIMESTAMP(3) NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "ai_summary" TEXT,
  "ai_processed" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "medical_exams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "medical_exams_patient_id_idx" ON "medical_exams"("patient_id");
CREATE INDEX IF NOT EXISTS "medical_exams_exam_type_idx" ON "medical_exams"("exam_type");
CREATE INDEX IF NOT EXISTS "medical_exams_exam_date_idx" ON "medical_exams"("exam_date");
ALTER TABLE "medical_exams" ADD CONSTRAINT "medical_exams_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clinic Staff
CREATE TABLE IF NOT EXISTS "clinic_staff" (
  "id" TEXT NOT NULL,
  "clinic_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinic_staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_staff_clinic_id_user_id_key" ON "clinic_staff"("clinic_id", "user_id");
CREATE INDEX IF NOT EXISTS "clinic_staff_clinic_id_idx" ON "clinic_staff"("clinic_id");
CREATE INDEX IF NOT EXISTS "clinic_staff_user_id_idx" ON "clinic_staff"("user_id");
ALTER TABLE "clinic_staff" ADD CONSTRAINT "clinic_staff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Provider Modules
CREATE TABLE IF NOT EXISTS "provider_modules" (
  "id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "module_key" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_modules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_modules_provider_id_module_key_key" ON "provider_modules"("provider_id", "module_key");
CREATE INDEX IF NOT EXISTS "provider_modules_provider_id_idx" ON "provider_modules"("provider_id");
CREATE INDEX IF NOT EXISTS "provider_modules_module_key_idx" ON "provider_modules"("module_key");
ALTER TABLE "provider_modules" ADD CONSTRAINT "provider_modules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================
-- PART 8: Update Foreign Key Constraints
-- (Rename constraints that reference old column names)
-- =============================================

-- Update FK constraint on appointments for room_id (was operatory_id)
-- Drop old constraint if exists, create new one
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_operatory_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "consultation_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update FK on room_assignments
ALTER TABLE "room_assignments" DROP CONSTRAINT IF EXISTS "operatory_assignments_operatory_id_fkey";
ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "consultation_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rename indexes that reference old names
-- (PostgreSQL keeps old names on RENAME, so we recreate them)

-- provider_patient_relations indexes
DROP INDEX IF EXISTS "patient_dentist_relations_patient_id_idx";
DROP INDEX IF EXISTS "patient_dentist_relations_dentist_id_idx";
DROP INDEX IF EXISTS "patient_dentist_relations_tenant_id_idx";
DROP INDEX IF EXISTS "patient_dentist_relations_patient_id_dentist_id_key";
CREATE INDEX IF NOT EXISTS "provider_patient_relations_patient_id_idx" ON "provider_patient_relations"("patient_id");
CREATE INDEX IF NOT EXISTS "provider_patient_relations_provider_id_idx" ON "provider_patient_relations"("provider_id");
CREATE INDEX IF NOT EXISTS "provider_patient_relations_tenant_id_idx" ON "provider_patient_relations"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "provider_patient_relations_patient_id_provider_id_key" ON "provider_patient_relations"("patient_id", "provider_id");

-- room_assignments indexes
DROP INDEX IF EXISTS "operatory_assignments_operatory_id_idx";
DROP INDEX IF EXISTS "operatory_assignments_dentist_id_idx";
DROP INDEX IF EXISTS "operatory_assignments_tenant_id_idx";
CREATE INDEX IF NOT EXISTS "room_assignments_room_id_idx" ON "room_assignments"("room_id");
CREATE INDEX IF NOT EXISTS "room_assignments_provider_id_idx" ON "room_assignments"("provider_id");
CREATE INDEX IF NOT EXISTS "room_assignments_tenant_id_idx" ON "room_assignments"("tenant_id");

-- consultation_rooms index
DROP INDEX IF EXISTS "operatories_clinic_id_idx";
CREATE INDEX IF NOT EXISTS "consultation_rooms_clinic_id_idx" ON "consultation_rooms"("clinic_id");

-- =============================================
-- PART 9: Rename FK constraint on consultation_rooms
-- =============================================

ALTER TABLE "consultation_rooms" DROP CONSTRAINT IF EXISTS "operatories_clinic_id_fkey";
ALTER TABLE "consultation_rooms" ADD CONSTRAINT "consultation_rooms_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add admin FK on clinics
ALTER TABLE "clinics" DROP CONSTRAINT IF EXISTS "clinics_admin_user_id_fkey";
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
