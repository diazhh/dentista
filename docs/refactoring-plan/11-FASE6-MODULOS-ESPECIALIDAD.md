# Phase 6: 7 Specialty Modules — Implementation Plan

## Summary

Implement 7 new medical specialty modules following the exact patterns from existing modules (dental, general-medicine, psychology). Each module needs: Prisma models → Backend (service + controller + DTOs + NestJS module) → Frontend (tab components + registry + API + icons).

**Modules:** Fisioterapia, Dermatologia, Oftalmologia, Cardiologia, Pediatria, Nutricion, Ginecologia

## Scope

| Layer | New | Modified |
|-------|-----|----------|
| Prisma models | 11 new models | `schema.prisma` |
| Backend modules | 7 NestJS modules (21 services, 21 controllers, 21 DTOs) | `module-definitions.ts`, `app.module.ts` |
| Frontend tabs | 14 new tab components | `registry.ts`, `PatientTabsContainer.tsx`, `api.ts` |

**Total: ~56 new files, 5 modified files**

---

## Module Specifications

### 1. Fisioterapia (`physiotherapy`)
**Prisma models:**
- `ExercisePlan` — patientId, providerId, tenantId, title, description, exercises (Json: [{name, sets, reps, duration, instructions, videoUrl}]), frequency, startDate, endDate, status (ACTIVE/COMPLETED/PAUSED), progress (Json), notes
- `FunctionalAssessment` — patientId, providerId, tenantId, assessmentType (INITIAL/PROGRESS/DISCHARGE), rangeOfMotion (Json: [{joint, movement, degrees, side}]), painScale (1-10), functionalScore, mobility (Json), strength (Json), balance (Json), goals (Json), notes

**Backend:** `modules/physiotherapy/` — exercise-plans (CRUD) + functional-assessments (CRUD)
**Frontend tabs:** "Ejercicios" (icon: `dumbbell`, order: 10) + "Evaluacion Funcional" (icon: `activity`, order: 11)
**Compatible specialties:** PHYSIOTHERAPY

### 2. Dermatologia (`dermatology`)
**Prisma models:**
- `SkinLesion` — patientId, providerId, tenantId, bodyLocation, locationDetails, lesionType (MACULE/PAPULE/NODULE/VESICLE/PUSTULE/PLAQUE/PATCH/ULCER/OTHER), size (Json: {length, width, depth}), color, shape, borders, texture, symptoms (string[]), diagnosis, differentialDiagnosis (string[]), biopsyRequired, biopsyDate, biopsyResult, images (Json: [{path, date, description}]), status (ACTIVE/MONITORING/RESOLVED/REFERRED), followUpDate, notes

**Backend:** `modules/dermatology/` — skin-lesions (CRUD)
**Frontend tabs:** "Lesiones" (icon: `scan`, order: 10)
**Compatible specialties:** DERMATOLOGY

### 3. Oftalmologia (`ophthalmology`)
**Prisma models:**
- `EyeExam` — patientId, providerId, tenantId, examType (COMPREHENSIVE/FOLLOW_UP/EMERGENCY), visualAcuityRight, visualAcuityLeft, intraocularPressureRight, intraocularPressureLeft, pupilResponse, anteriorSegment (Json), posteriorSegment (Json), fundoscopy (Json), colorVision, peripheralVision, diagnosis, notes
- `LensPrescription` — patientId, providerId, tenantId, eyeExamId?, rightSphere, rightCylinder, rightAxis, rightAdd, rightPd, leftSphere, leftCylinder, leftAxis, leftAdd, leftPd, prescriptionType (GLASSES/CONTACT_LENSES), material, coatings (string[]), expiresAt, notes

**Backend:** `modules/ophthalmology/` — eye-exams (CRUD) + lens-prescriptions (CRUD)
**Frontend tabs:** "Examenes Oculares" (icon: `eye`, order: 10) + "Receta Optica" (icon: `glasses`, order: 11)
**Compatible specialties:** OPHTHALMOLOGY

### 4. Cardiologia (`cardiology`)
**Prisma models:**
- `CardiacAssessment` — patientId, providerId, tenantId, assessmentType (INITIAL/FOLLOW_UP/EMERGENCY), bloodPressureSystolic, bloodPressureDiastolic, heartRate, rhythm (REGULAR/IRREGULAR/ARRHYTHMIA), ecgFindings, echoFindings (Json: {ejectionFraction, wallMotion, valveFunction, chamberSizes}), lipidPanel (Json: {totalCholesterol, ldl, hdl, triglycerides}), riskFactors (string[]: smoking, diabetes, hypertension, obesity, familyHistory, sedentary), riskScore, medications (Json[]), diagnosis, plan, notes

**Backend:** `modules/cardiology/` — cardiac-assessments (CRUD)
**Frontend tabs:** "Evaluacion Cardiaca" (icon: `heart-pulse`, order: 10)
**Compatible specialties:** CARDIOLOGY

### 5. Pediatria (`pediatrics`)
**Prisma models:**
- `GrowthRecord` — patientId, providerId, tenantId, measurementDate, ageMonths, weight, height, headCircumference, bmi, weightPercentile, heightPercentile, headPercentile, bmiPercentile, notes
- `VaccinationRecord` — patientId, providerId, tenantId, vaccineName, vaccineType, doseNumber, administeredDate, nextDoseDate, batchNumber, site, route, manufacturer, adverseReaction, notes

**Backend:** `modules/pediatrics/` — growth-records (CRUD) + vaccination-records (CRUD)
**Frontend tabs:** "Crecimiento" (icon: `ruler`, order: 10) + "Vacunas" (icon: `syringe`, order: 11)
**Compatible specialties:** PEDIATRICS

### 6. Nutricion (`nutrition`)
**Prisma models:**
- `NutritionPlan` — patientId, providerId, tenantId, title, objective (WEIGHT_LOSS/WEIGHT_GAIN/MAINTENANCE/THERAPEUTIC/SPORTS), dailyCalories, macros (Json: {protein, carbs, fat, fiber}), meals (Json[]: [{name, time, foods: [{item, portion, calories, notes}]}]), restrictions (string[]), supplements (string[]), startDate, endDate, status (ACTIVE/COMPLETED/PAUSED), notes
- `BodyMeasurement` — patientId, providerId, tenantId, measurementDate, weight, height, bmi, bodyFatPercentage, muscleMass, waistCircumference, hipCircumference, chestCircumference, armCircumference, thighCircumference, notes

**Backend:** `modules/nutrition/` — nutrition-plans (CRUD) + body-measurements (CRUD)
**Frontend tabs:** "Plan Alimentario" (icon: `apple`, order: 10) + "Medidas" (icon: `scale`, order: 11)
**Compatible specialties:** NUTRITION

### 7. Ginecologia (`gynecology`)
**Prisma models:**
- `GynecologicalExam` — patientId, providerId, tenantId, examType (ROUTINE/PRENATAL/COLPOSCOPY/ULTRASOUND/PAP_SMEAR), lastMenstrualPeriod, menstrualCycleLength, menstrualRegularity (REGULAR/IRREGULAR/AMENORRHEA), contraceptiveMethod, pregnancyHistory (Json: {gravida, para, abortions, livingChildren}), currentPregnancy (Json?: {gestationalWeeks, edd, complications[]}), examFindings (Json), papSmearResult, ultrasoundFindings (Json), labResults (Json), diagnosis, plan, nextAppointmentDate, notes

**Backend:** `modules/gynecology/` — gynecological-exams (CRUD)
**Frontend tabs:** "Examen Ginecologico" (icon: `baby`, order: 10)
**Compatible specialties:** GYNECOLOGY

---

## Files to CREATE (~56)

### Prisma (1 file modified)
`backend/prisma/schema.prisma` — Add 11 new models at the end

### Backend — 7 modules × (module + service + controller + dto) = ~35 files

| Module | Directory | Files |
|--------|-----------|-------|
| Physiotherapy | `backend/src/modules/physiotherapy/` | `physiotherapy.module.ts`, `exercise-plans.service.ts`, `exercise-plans.controller.ts`, `functional-assessments.service.ts`, `functional-assessments.controller.ts`, `dto/exercise-plans.dto.ts`, `dto/functional-assessments.dto.ts` |
| Dermatology | `backend/src/modules/dermatology/` | `dermatology.module.ts`, `skin-lesions.service.ts`, `skin-lesions.controller.ts`, `dto/skin-lesions.dto.ts` |
| Ophthalmology | `backend/src/modules/ophthalmology/` | `ophthalmology.module.ts`, `eye-exams.service.ts`, `eye-exams.controller.ts`, `lens-prescriptions.service.ts`, `lens-prescriptions.controller.ts`, `dto/eye-exams.dto.ts`, `dto/lens-prescriptions.dto.ts` |
| Cardiology | `backend/src/modules/cardiology/` | `cardiology.module.ts`, `cardiac-assessments.service.ts`, `cardiac-assessments.controller.ts`, `dto/cardiac-assessments.dto.ts` |
| Pediatrics | `backend/src/modules/pediatrics/` | `pediatrics.module.ts`, `growth-records.service.ts`, `growth-records.controller.ts`, `vaccination-records.service.ts`, `vaccination-records.controller.ts`, `dto/growth-records.dto.ts`, `dto/vaccination-records.dto.ts` |
| Nutrition | `backend/src/modules/nutrition/` | `nutrition.module.ts`, `nutrition-plans.service.ts`, `nutrition-plans.controller.ts`, `body-measurements.service.ts`, `body-measurements.controller.ts`, `dto/nutrition-plans.dto.ts`, `dto/body-measurements.dto.ts` |
| Gynecology | `backend/src/modules/gynecology/` | `gynecology.module.ts`, `gynecological-exams.service.ts`, `gynecological-exams.controller.ts`, `dto/gynecological-exams.dto.ts` |

### Frontend — 14 new tab components

| Module | Directory | Files |
|--------|-----------|-------|
| Physiotherapy | `frontend/src/components/modules/physiotherapy/` | `ExercisePlansTab.tsx`, `FunctionalAssessmentsTab.tsx` |
| Dermatology | `frontend/src/components/modules/dermatology/` | `SkinLesionsTab.tsx` |
| Ophthalmology | `frontend/src/components/modules/ophthalmology/` | `EyeExamsTab.tsx`, `LensPrescriptionsTab.tsx` |
| Cardiology | `frontend/src/components/modules/cardiology/` | `CardiacAssessmentsTab.tsx` |
| Pediatrics | `frontend/src/components/modules/pediatrics/` | `GrowthRecordsTab.tsx`, `VaccinationRecordsTab.tsx` |
| Nutrition | `frontend/src/components/modules/nutrition/` | `NutritionPlansTab.tsx`, `BodyMeasurementsTab.tsx` |
| Gynecology | `frontend/src/components/modules/gynecology/` | `GynecologicalExamsTab.tsx` |

## Files to MODIFY (5)

| File | Changes |
|------|---------|
| `backend/prisma/schema.prisma` | Add 11 new models |
| `backend/src/modules/module-definitions.ts` | Add 7 new ModuleDefinition entries to MODULE_DEFINITIONS |
| `backend/src/app.module.ts` | Import 7 new NestJS modules |
| `frontend/src/modules/registry.ts` | Add 7 new ModuleRegistryEntry objects with 14 patientTabs |
| `frontend/src/components/patient/PatientTabsContainer.tsx` | Add 11 new icons to iconMap (Dumbbell, Activity, Scan, Eye, Glasses, HeartPulse, Ruler, Syringe, Apple, Scale, Baby) |

Note: `frontend/src/services/api.ts` does NOT need changes — existing module tabs (psychology, general-medicine) use `api.get/post/patch/delete` directly, not separate API exports.

---

## Execution Order

```
Wave 1: Foundation (sequential)
  Agent 1 → Prisma schema (11 models) + npx prisma db push
  Agent 2 → Module definitions (7 entries) + app.module.ts imports

Wave 2: Implementation (parallel, after Wave 1)
  Agent 3 → Backend modules: physiotherapy, dermatology, ophthalmology, cardiology
  Agent 4 → Backend modules: pediatrics, nutrition, gynecology
  Agent 5 → Frontend: all 14 tab components + registry + iconMap

Wave 3: Verification
  tsc --noEmit (backend + frontend) → 0 errors
  Update docs: 00-VISION-GENERAL.md, 08-MIGRACION.md, MEMORY.md
```

---

## Agent 1: Prisma Schema (11 models)

Add to end of `backend/prisma/schema.prisma`:

### ExercisePlan
```
model ExercisePlan {
  id          String   @id @default(uuid())
  patientId   String   @map("patient_id")
  providerId  String   @map("provider_id")
  tenantId    String   @map("tenant_id")
  title       String
  description String?  @db.Text
  exercises   Json     // [{name, sets, reps, duration, instructions, videoUrl}]
  frequency   String?  // e.g. "3x/week"
  startDate   DateTime @map("start_date")
  endDate     DateTime? @map("end_date")
  status      String   @default("ACTIVE") // ACTIVE, COMPLETED, PAUSED
  progress    Json?    // tracking data
  notes       String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([providerId])
  @@index([tenantId])
  @@map("exercise_plans")
}
```

### FunctionalAssessment
```
model FunctionalAssessment {
  id              String   @id @default(uuid())
  patientId       String   @map("patient_id")
  providerId      String   @map("provider_id")
  tenantId        String   @map("tenant_id")
  assessmentType  String   @default("INITIAL") @map("assessment_type") // INITIAL, PROGRESS, DISCHARGE
  rangeOfMotion   Json?    @map("range_of_motion") // [{joint, movement, degrees, side}]
  painScale       Int?     @map("pain_scale") // 1-10
  functionalScore Int?     @map("functional_score")
  mobility        Json?
  strength        Json?
  balance         Json?
  goals           Json?    // [{goal, targetDate, achieved}]
  notes           String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("functional_assessments")
}
```

### SkinLesion
```
model SkinLesion {
  id                    String   @id @default(uuid())
  patientId             String   @map("patient_id")
  providerId            String   @map("provider_id")
  tenantId              String   @map("tenant_id")
  bodyLocation          String   @map("body_location")
  locationDetails       String?  @map("location_details")
  lesionType            String   @map("lesion_type") // MACULE, PAPULE, NODULE, VESICLE, PUSTULE, PLAQUE, PATCH, ULCER, OTHER
  size                  Json?    // {length, width, depth}
  color                 String?
  shape                 String?
  borders               String?
  texture               String?
  symptoms              String[] @default([])
  diagnosis             String?
  differentialDiagnosis String[] @default([]) @map("differential_diagnosis")
  biopsyRequired        Boolean  @default(false) @map("biopsy_required")
  biopsyDate            DateTime? @map("biopsy_date")
  biopsyResult          String?  @map("biopsy_result")
  images                Json?    // [{path, date, description}]
  status                String   @default("ACTIVE") // ACTIVE, MONITORING, RESOLVED, REFERRED
  followUpDate          DateTime? @map("follow_up_date")
  notes                 String?  @db.Text
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("skin_lesions")
}
```

### EyeExam
```
model EyeExam {
  id                        String   @id @default(uuid())
  patientId                 String   @map("patient_id")
  providerId                String   @map("provider_id")
  tenantId                  String   @map("tenant_id")
  examType                  String   @default("COMPREHENSIVE") @map("exam_type")
  visualAcuityRight         String?  @map("visual_acuity_right")
  visualAcuityLeft          String?  @map("visual_acuity_left")
  intraocularPressureRight  Float?   @map("intraocular_pressure_right")
  intraocularPressureLeft   Float?   @map("intraocular_pressure_left")
  pupilResponse             String?  @map("pupil_response")
  anteriorSegment           Json?    @map("anterior_segment")
  posteriorSegment          Json?    @map("posterior_segment")
  fundoscopy                Json?
  colorVision               String?  @map("color_vision")
  peripheralVision          String?  @map("peripheral_vision")
  diagnosis                 String?
  notes                     String?  @db.Text
  createdAt                 DateTime @default(now()) @map("created_at")
  updatedAt                 DateTime @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("eye_exams")
}
```

### LensPrescription
```
model LensPrescription {
  id                String   @id @default(uuid())
  patientId         String   @map("patient_id")
  providerId        String   @map("provider_id")
  tenantId          String   @map("tenant_id")
  eyeExamId         String?  @map("eye_exam_id")
  rightSphere       Float?   @map("right_sphere")
  rightCylinder     Float?   @map("right_cylinder")
  rightAxis         Int?     @map("right_axis")
  rightAdd          Float?   @map("right_add")
  rightPd           Float?   @map("right_pd")
  leftSphere        Float?   @map("left_sphere")
  leftCylinder      Float?   @map("left_cylinder")
  leftAxis          Int?     @map("left_axis")
  leftAdd           Float?   @map("left_add")
  leftPd            Float?   @map("left_pd")
  prescriptionType  String   @default("GLASSES") @map("prescription_type") // GLASSES, CONTACT_LENSES
  material          String?
  coatings          String[] @default([])
  expiresAt         DateTime? @map("expires_at")
  notes             String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("lens_prescriptions")
}
```

### CardiacAssessment
```
model CardiacAssessment {
  id                      String   @id @default(uuid())
  patientId               String   @map("patient_id")
  providerId              String   @map("provider_id")
  tenantId                String   @map("tenant_id")
  assessmentType          String   @default("INITIAL") @map("assessment_type")
  bloodPressureSystolic   Int?     @map("bp_systolic")
  bloodPressureDiastolic  Int?     @map("bp_diastolic")
  heartRate               Int?     @map("heart_rate")
  rhythm                  String?  // REGULAR, IRREGULAR, ARRHYTHMIA
  ecgFindings             String?  @map("ecg_findings") @db.Text
  echoFindings            Json?    @map("echo_findings") // {ejectionFraction, wallMotion, valveFunction, chamberSizes}
  lipidPanel              Json?    @map("lipid_panel") // {totalCholesterol, ldl, hdl, triglycerides}
  riskFactors             String[] @default([]) @map("risk_factors")
  riskScore               Float?   @map("risk_score")
  medications             Json?    // current cardiac medications
  diagnosis               String?
  plan                    String?  @db.Text
  notes                   String?  @db.Text
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("cardiac_assessments")
}
```

### GrowthRecord
```
model GrowthRecord {
  id                String   @id @default(uuid())
  patientId         String   @map("patient_id")
  providerId        String   @map("provider_id")
  tenantId          String   @map("tenant_id")
  measurementDate   DateTime @map("measurement_date")
  ageMonths         Int      @map("age_months")
  weight            Float?   // kg
  height            Float?   // cm
  headCircumference Float?   @map("head_circumference") // cm
  bmi               Float?
  weightPercentile  Float?   @map("weight_percentile")
  heightPercentile  Float?   @map("height_percentile")
  headPercentile    Float?   @map("head_percentile")
  bmiPercentile     Float?   @map("bmi_percentile")
  notes             String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("growth_records")
}
```

### VaccinationRecord
```
model VaccinationRecord {
  id               String    @id @default(uuid())
  patientId        String    @map("patient_id")
  providerId       String    @map("provider_id")
  tenantId         String    @map("tenant_id")
  vaccineName      String    @map("vaccine_name")
  vaccineType      String?   @map("vaccine_type")
  doseNumber       Int       @map("dose_number")
  administeredDate DateTime  @map("administered_date")
  nextDoseDate     DateTime? @map("next_dose_date")
  batchNumber      String?   @map("batch_number")
  site             String?   // injection site
  route            String?   // IM, SC, oral
  manufacturer     String?
  adverseReaction  String?   @map("adverse_reaction")
  notes            String?   @db.Text
  createdAt        DateTime  @default(now()) @map("created_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("vaccination_records")
}
```

### NutritionPlan
```
model NutritionPlan {
  id            String    @id @default(uuid())
  patientId     String    @map("patient_id")
  providerId    String    @map("provider_id")
  tenantId      String    @map("tenant_id")
  title         String
  objective     String?   // WEIGHT_LOSS, WEIGHT_GAIN, MAINTENANCE, THERAPEUTIC, SPORTS
  dailyCalories Int?      @map("daily_calories")
  macros        Json?     // {protein, carbs, fat, fiber} in grams
  meals         Json?     // [{name, time, foods: [{item, portion, calories, notes}]}]
  restrictions  String[]  @default([])
  supplements   String[]  @default([])
  startDate     DateTime  @map("start_date")
  endDate       DateTime? @map("end_date")
  status        String    @default("ACTIVE") // ACTIVE, COMPLETED, PAUSED
  notes         String?   @db.Text
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("nutrition_plans")
}
```

### BodyMeasurement
```
model BodyMeasurement {
  id                  String   @id @default(uuid())
  patientId           String   @map("patient_id")
  providerId          String   @map("provider_id")
  tenantId            String   @map("tenant_id")
  measurementDate     DateTime @map("measurement_date")
  weight              Float?   // kg
  height              Float?   // cm
  bmi                 Float?
  bodyFatPercentage   Float?   @map("body_fat_percentage")
  muscleMass          Float?   @map("muscle_mass")
  waistCircumference  Float?   @map("waist_circumference")
  hipCircumference    Float?   @map("hip_circumference")
  chestCircumference  Float?   @map("chest_circumference")
  armCircumference    Float?   @map("arm_circumference")
  thighCircumference  Float?   @map("thigh_circumference")
  notes               String?  @db.Text
  createdAt           DateTime @default(now()) @map("created_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("body_measurements")
}
```

### GynecologicalExam
```
model GynecologicalExam {
  id                    String    @id @default(uuid())
  patientId             String    @map("patient_id")
  providerId            String    @map("provider_id")
  tenantId              String    @map("tenant_id")
  examType              String    @default("ROUTINE") @map("exam_type") // ROUTINE, PRENATAL, COLPOSCOPY, ULTRASOUND, PAP_SMEAR
  lastMenstrualPeriod   DateTime? @map("last_menstrual_period")
  menstrualCycleLength  Int?      @map("menstrual_cycle_length")
  menstrualRegularity   String?   @map("menstrual_regularity") // REGULAR, IRREGULAR, AMENORRHEA
  contraceptiveMethod   String?   @map("contraceptive_method")
  pregnancyHistory      Json?     @map("pregnancy_history") // {gravida, para, abortions, livingChildren}
  currentPregnancy      Json?     @map("current_pregnancy") // {gestationalWeeks, edd, complications[]}
  examFindings          Json?     @map("exam_findings")
  papSmearResult        String?   @map("pap_smear_result")
  ultrasoundFindings    Json?     @map("ultrasound_findings")
  labResults            Json?     @map("lab_results")
  diagnosis             String?
  plan                  String?   @db.Text
  nextAppointmentDate   DateTime? @map("next_appointment_date")
  notes                 String?   @db.Text
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  @@index([patientId])
  @@index([tenantId])
  @@map("gynecological_exams")
}
```

After adding: `cd backend && npx prisma db push`

---

## Agent 2: Module Definitions + App Module

### 2.1 Module Definitions (`backend/src/modules/module-definitions.ts`)

Add 7 entries to `MODULE_DEFINITIONS`:

```typescript
physiotherapy: {
  key: 'physiotherapy', name: 'Fisioterapia',
  description: 'Planes de ejercicios, evaluaciones funcionales, seguimiento de rehabilitacion',
  icon: 'dumbbell', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.PHYSIOTHERAPY],
  features: [
    { key: 'exercise-plans', name: 'Planes de Ejercicios', description: 'Rutinas de rehabilitacion y fortalecimiento' },
    { key: 'functional-assessments', name: 'Evaluaciones Funcionales', description: 'Rango de movimiento, dolor, movilidad' },
  ],
  models: ['ExercisePlan', 'FunctionalAssessment'],
  apiPrefix: '/api/modules/physiotherapy',
  defaultConfig: { defaultPlanDuration: 30 },
},
dermatology: {
  key: 'dermatology', name: 'Dermatologia',
  description: 'Registro de lesiones cutaneas, body mapping, seguimiento visual',
  icon: 'scan', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.DERMATOLOGY],
  features: [
    { key: 'skin-lesions', name: 'Lesiones Cutaneas', description: 'Registro y seguimiento de lesiones con imagenes' },
  ],
  models: ['SkinLesion'],
  apiPrefix: '/api/modules/dermatology',
  defaultConfig: {},
},
ophthalmology: {
  key: 'ophthalmology', name: 'Oftalmologia',
  description: 'Examenes oculares, presion intraocular, receta de lentes',
  icon: 'eye', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.OPHTHALMOLOGY],
  features: [
    { key: 'eye-exams', name: 'Examenes Oculares', description: 'Agudeza visual, PIO, fondo de ojo' },
    { key: 'lens-prescriptions', name: 'Receta Optica', description: 'Prescripcion de lentes y lentes de contacto' },
  ],
  models: ['EyeExam', 'LensPrescription'],
  apiPrefix: '/api/modules/ophthalmology',
  defaultConfig: {},
},
cardiology: {
  key: 'cardiology', name: 'Cardiologia',
  description: 'Evaluaciones cardiacas, ECG, ecocardiograma, perfil lipidico',
  icon: 'heart-pulse', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.CARDIOLOGY],
  features: [
    { key: 'cardiac-assessments', name: 'Evaluaciones Cardiacas', description: 'Presion arterial, ECG, eco, riesgo cardiovascular' },
  ],
  models: ['CardiacAssessment'],
  apiPrefix: '/api/modules/cardiology',
  defaultConfig: {},
},
pediatrics: {
  key: 'pediatrics', name: 'Pediatria',
  description: 'Curvas de crecimiento, vacunacion, desarrollo infantil',
  icon: 'ruler', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.PEDIATRICS],
  features: [
    { key: 'growth-records', name: 'Curvas de Crecimiento', description: 'Peso, talla, perimetro cefalico, percentiles' },
    { key: 'vaccination-records', name: 'Vacunacion', description: 'Registro de vacunas, dosis, proximas citas' },
  ],
  models: ['GrowthRecord', 'VaccinationRecord'],
  apiPrefix: '/api/modules/pediatrics',
  defaultConfig: { growthStandard: 'WHO' },
},
nutrition: {
  key: 'nutrition', name: 'Nutricion',
  description: 'Planes alimentarios, macros, medidas corporales, seguimiento',
  icon: 'apple', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.NUTRITION],
  features: [
    { key: 'nutrition-plans', name: 'Planes Alimentarios', description: 'Calorias, macros, comidas y restricciones' },
    { key: 'body-measurements', name: 'Medidas Corporales', description: 'Peso, grasa, masa muscular, perimetros' },
  ],
  models: ['NutritionPlan', 'BodyMeasurement'],
  apiPrefix: '/api/modules/nutrition',
  defaultConfig: { defaultCalorieGoal: 2000 },
},
gynecology: {
  key: 'gynecology', name: 'Ginecologia',
  description: 'Control ginecologico, prenatal, papanicolaou, ecografias',
  icon: 'baby', version: '1.0.0',
  compatibleSpecialties: [MedicalSpecialty.GYNECOLOGY],
  features: [
    { key: 'gynecological-exams', name: 'Examenes Ginecologicos', description: 'Control prenatal, PAP, ecografia, historia obstetrica' },
  ],
  models: ['GynecologicalExam'],
  apiPrefix: '/api/modules/gynecology',
  defaultConfig: {},
},
```

### 2.2 App Module (`backend/src/app.module.ts`)

Add 7 imports + 7 module entries to `imports` array:
```typescript
import { PhysiotherapyModule } from './modules/physiotherapy/physiotherapy.module';
import { DermatologyModule } from './modules/dermatology/dermatology.module';
import { OphthalmologyModule } from './modules/ophthalmology/ophthalmology.module';
import { CardiologyModule } from './modules/cardiology/cardiology.module';
import { PediatricsModule } from './modules/pediatrics/pediatrics.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { GynecologyModule } from './modules/gynecology/gynecology.module';
```

---

## Agent 3: Backend — Physiotherapy, Dermatology, Ophthalmology, Cardiology

Each module follows the exact same pattern as `general-medicine/` and `psychology/`:
- Service: `constructor(private prisma: PrismaService)`, CRUD with `providerId` + `tenantId` isolation, JSON fields via `JSON.parse(JSON.stringify(dto.field))`
- Controller: `@UseGuards(JwtAuthGuard)`, `@Controller('modules/{module-key}/{entity}')`, extracts `req.user.userId` and `req.user.tenantId || req.user.userId`
- DTO: `class-validator` decorators, `@ApiProperty`/`@ApiPropertyOptional`
- Module: imports `PrismaModule`, exports services

### 3.1 Physiotherapy (7 files)
- `exercise-plans.service.ts` — CRUD for ExercisePlan. `exercises` and `progress` fields use JSON.parse(JSON.stringify())
- `exercise-plans.controller.ts` — `modules/physiotherapy/exercise-plans`
- `dto/exercise-plans.dto.ts` — Create: patientId, title, exercises(Json), frequency?, startDate, endDate?, notes?. Update: all optional
- `functional-assessments.service.ts` — CRUD for FunctionalAssessment. rangeOfMotion, mobility, strength, balance, goals use JSON serialization
- `functional-assessments.controller.ts` — `modules/physiotherapy/functional-assessments`
- `dto/functional-assessments.dto.ts` — Create: patientId, assessmentType?, rangeOfMotion?, painScale?, functionalScore?, mobility?, strength?, balance?, goals?, notes?
- `physiotherapy.module.ts` — combines both

### 3.2 Dermatology (4 files)
- `skin-lesions.service.ts` — CRUD for SkinLesion. `size`, `images` use JSON serialization
- `skin-lesions.controller.ts` — `modules/dermatology/skin-lesions`
- `dto/skin-lesions.dto.ts` — Create: patientId, bodyLocation, lesionType, size?, color?, symptoms?, diagnosis?, biopsyRequired?, images?, status?, notes?. Update: all optional
- `dermatology.module.ts`

### 3.3 Ophthalmology (7 files)
- `eye-exams.service.ts` — CRUD for EyeExam. anteriorSegment, posteriorSegment, fundoscopy use JSON serialization
- `eye-exams.controller.ts` — `modules/ophthalmology/eye-exams`
- `dto/eye-exams.dto.ts` — Create: patientId, examType?, visualAcuityRight?, visualAcuityLeft?, intraocularPressureRight/Left?, anteriorSegment?, posteriorSegment?, fundoscopy?, diagnosis?, notes?
- `lens-prescriptions.service.ts` — CRUD for LensPrescription
- `lens-prescriptions.controller.ts` — `modules/ophthalmology/lens-prescriptions`
- `dto/lens-prescriptions.dto.ts` — Create: patientId, eyeExamId?, right/left Sphere/Cylinder/Axis/Add/Pd, prescriptionType?, material?, coatings?, expiresAt?, notes?
- `ophthalmology.module.ts`

### 3.4 Cardiology (4 files)
- `cardiac-assessments.service.ts` — CRUD. echoFindings, lipidPanel, medications use JSON serialization
- `cardiac-assessments.controller.ts` — `modules/cardiology/cardiac-assessments`
- `dto/cardiac-assessments.dto.ts` — Create: patientId, assessmentType?, bp systolic/diastolic?, heartRate?, rhythm?, ecgFindings?, echoFindings?, lipidPanel?, riskFactors?, riskScore?, medications?, diagnosis?, plan?, notes?
- `cardiology.module.ts`

---

## Agent 4: Backend — Pediatrics, Nutrition, Gynecology

### 4.1 Pediatrics (7 files)
- `growth-records.service.ts` — CRUD for GrowthRecord (all numeric fields, no JSON serialization needed)
- `growth-records.controller.ts` — `modules/pediatrics/growth-records`
- `dto/growth-records.dto.ts` — Create: patientId, measurementDate, ageMonths, weight?, height?, headCircumference?, bmi?, percentiles?, notes?
- `vaccination-records.service.ts` — CRUD for VaccinationRecord
- `vaccination-records.controller.ts` — `modules/pediatrics/vaccination-records`
- `dto/vaccination-records.dto.ts` — Create: patientId, vaccineName, doseNumber, administeredDate, vaccineType?, nextDoseDate?, batchNumber?, site?, route?, manufacturer?, adverseReaction?, notes?
- `pediatrics.module.ts`

### 4.2 Nutrition (7 files)
- `nutrition-plans.service.ts` — CRUD for NutritionPlan. macros, meals use JSON serialization
- `nutrition-plans.controller.ts` — `modules/nutrition/nutrition-plans`
- `dto/nutrition-plans.dto.ts` — Create: patientId, title, objective?, dailyCalories?, macros?, meals?, restrictions?, supplements?, startDate, endDate?, notes?
- `body-measurements.service.ts` — CRUD for BodyMeasurement (all numeric, no JSON serialization)
- `body-measurements.controller.ts` — `modules/nutrition/body-measurements`
- `dto/body-measurements.dto.ts` — Create: patientId, measurementDate, weight?, height?, bmi?, bodyFatPercentage?, muscleMass?, circumferences?, notes?
- `nutrition.module.ts`

### 4.3 Gynecology (4 files)
- `gynecological-exams.service.ts` — CRUD. pregnancyHistory, currentPregnancy, examFindings, ultrasoundFindings, labResults use JSON serialization
- `gynecological-exams.controller.ts` — `modules/gynecology/gynecological-exams`
- `dto/gynecological-exams.dto.ts` — Create: patientId, examType?, lastMenstrualPeriod?, menstrualCycleLength?, menstrualRegularity?, contraceptiveMethod?, pregnancyHistory?, currentPregnancy?, examFindings?, papSmearResult?, ultrasoundFindings?, labResults?, diagnosis?, plan?, nextAppointmentDate?, notes?
- `gynecology.module.ts`

---

## Agent 5: Frontend — Tabs + Registry + Icons

### 5.1 Frontend Tab Components (14 files)

Each tab follows the OdontogramsTab pattern — a full CRUD component using `api.get/post/patch/delete` directly:
- `useState` for data, loading, modals
- `useEffect` to fetch on mount: `api.get('/modules/{key}/{entity}', { params: { patientId } })`
- Create/edit form in a modal
- List view with cards
- Delete with confirmation
- All text in Spanish

**Physiotherapy:**
- `ExercisePlansTab.tsx` — List of exercise plans with status badges (ACTIVE=green, COMPLETED=blue, PAUSED=yellow), expand to see exercise details (name, sets×reps, duration), create/edit form with dynamic exercise rows
- `FunctionalAssessmentsTab.tsx` — Assessment cards with type badge, pain scale (visual 1-10 bar), functional score, ROM entries list, goals progress

**Dermatology:**
- `SkinLesionsTab.tsx` — Lesion cards with body location, type badge, status badge, size display, symptoms list, biopsy status (required/done/result), follow-up date

**Ophthalmology:**
- `EyeExamsTab.tsx` — Exam cards with type badge, VA display (OD/OS format), IOP values, diagnosis, expandable findings sections
- `LensPrescriptionsTab.tsx` — Prescription cards with OD/OS columns (sphere, cyl, axis, add, PD), type badge (GLASSES/CONTACT_LENSES), expiry date

**Cardiology:**
- `CardiacAssessmentsTab.tsx` — Assessment cards with BP display (systolic/diastolic mmHg), HR (bpm), rhythm badge, risk factors chips, risk score, lipid panel values, ECG/echo findings expandable

**Pediatrics:**
- `GrowthRecordsTab.tsx` — Growth table with date, age, weight, height, HC, BMI, percentiles with color coding (<5=red, 5-95=green, >95=yellow)
- `VaccinationRecordsTab.tsx` — Vaccination timeline/table with vaccine name, dose #, date, next dose, manufacturer, batch, adverse reaction flag

**Nutrition:**
- `NutritionPlansTab.tsx` — Plan cards with objective badge, calories/macros summary bar, meals expandable list, restrictions/supplements chips, status badge
- `BodyMeasurementsTab.tsx` — Measurement cards/table with date, weight, BMI, body fat %, muscle mass, circumferences, trend arrows (↑↓) comparing to previous

**Gynecology:**
- `GynecologicalExamsTab.tsx` — Exam cards with type badge, LMP date, cycle info, pregnancy history summary (G/P/A), PAP result, expandable findings, next appointment

### 5.2 Module Registry (`frontend/src/modules/registry.ts`)

Add 7 new entries to `moduleRegistry`:

```typescript
physiotherapy: {
  key: 'physiotherapy', name: 'Fisioterapia',
  patientTabs: [
    { id: 'exercise-plans', label: 'Ejercicios', shortLabel: 'Ejer.', icon: 'dumbbell', component: lazy(...), order: 10 },
    { id: 'functional-assessments', label: 'Evaluacion Funcional', shortLabel: 'Eval.', icon: 'activity', component: lazy(...), order: 11 },
  ],
},
dermatology: {
  key: 'dermatology', name: 'Dermatologia',
  patientTabs: [
    { id: 'skin-lesions', label: 'Lesiones', icon: 'scan', component: lazy(...), order: 10 },
  ],
},
ophthalmology: {
  key: 'ophthalmology', name: 'Oftalmologia',
  patientTabs: [
    { id: 'eye-exams', label: 'Examenes Oculares', shortLabel: 'Ojos', icon: 'eye', component: lazy(...), order: 10 },
    { id: 'lens-prescriptions', label: 'Receta Optica', shortLabel: 'Lentes', icon: 'glasses', component: lazy(...), order: 11 },
  ],
},
cardiology: {
  key: 'cardiology', name: 'Cardiologia',
  patientTabs: [
    { id: 'cardiac-assessments', label: 'Evaluacion Cardiaca', shortLabel: 'Cardio', icon: 'heart-pulse', component: lazy(...), order: 10 },
  ],
},
pediatrics: {
  key: 'pediatrics', name: 'Pediatria',
  patientTabs: [
    { id: 'growth-records', label: 'Crecimiento', icon: 'ruler', component: lazy(...), order: 10 },
    { id: 'vaccination-records', label: 'Vacunas', icon: 'syringe', component: lazy(...), order: 11 },
  ],
},
nutrition: {
  key: 'nutrition', name: 'Nutricion',
  patientTabs: [
    { id: 'nutrition-plans', label: 'Plan Alimentario', shortLabel: 'Dieta', icon: 'apple', component: lazy(...), order: 10 },
    { id: 'body-measurements', label: 'Medidas', icon: 'scale', component: lazy(...), order: 11 },
  ],
},
gynecology: {
  key: 'gynecology', name: 'Ginecologia',
  patientTabs: [
    { id: 'gynecological-exams', label: 'Examen Ginecologico', shortLabel: 'Gineco', icon: 'baby', component: lazy(...), order: 10 },
  ],
},
```

### 5.3 PatientTabsContainer Icons (`frontend/src/components/patient/PatientTabsContainer.tsx`)

Add 11 new icons to imports and iconMap:
```typescript
import { ..., Dumbbell, Activity, Scan, Eye, Glasses, HeartPulse, Ruler, Syringe, Apple, Scale, Baby } from 'lucide-react';

// Add to iconMap:
'dumbbell': <Dumbbell className="h-4 w-4" />,
'activity': <Activity className="h-4 w-4" />,
'scan': <Scan className="h-4 w-4" />,
'eye': <Eye className="h-4 w-4" />,
'glasses': <Glasses className="h-4 w-4" />,
'heart-pulse': <HeartPulse className="h-4 w-4" />,
'ruler': <Ruler className="h-4 w-4" />,
'syringe': <Syringe className="h-4 w-4" />,
'apple': <Apple className="h-4 w-4" />,
'scale': <Scale className="h-4 w-4" />,
'baby': <Baby className="h-4 w-4" />,
```

---

## Verification

1. `cd backend && npx prisma db push` → schema synced (11 new tables)
2. `cd backend && npx tsc --noEmit` → 0 errors
3. `cd frontend && npx tsc --noEmit` → 0 errors
4. Update docs:
   - `00-VISION-GENERAL.md` — Add Phase 6 section marked ✅
   - `08-MIGRACION-PASO-A-PASO.md` — Add Phase 6 migration steps
   - `MEMORY.md` — Add Phase 6 completion, new files, architecture notes

## Key Patterns to Follow

- **Service pattern**: `constructor(private prisma: PrismaService)`, CRUD methods take `(providerId, tenantId, dto)` or `(id, providerId, tenantId)`
- **Controller pattern**: `@UseGuards(JwtAuthGuard)`, `@Controller('modules/{key}/{entity}')`, `@Request() req` → `req.user.userId` + `req.user.tenantId || req.user.userId`
- **JSON fields**: Use `JSON.parse(JSON.stringify(dto.field))` to satisfy Prisma's InputJsonValue type
- **Frontend tabs**: Use `api.get/post/patch/delete` directly (not separate API export objects), `useState` + `useEffect` pattern
- **All UI text in Spanish**
