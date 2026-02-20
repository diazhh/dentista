# Plan de Semillas Multi-Disciplina para MediCloud

## Estado Actual del Seed

### Lo que YA existe:
- 1 Super Admin, 3 Providers (todos dentistas), 3 Staff, 2 Patients con portal
- 5 Tenants (drsmith, drgarcia, smilecare, brightsmile, dentalplus)
- 1 Clínica, 1 Consultorio, 1 Room Assignment
- 3 Subscription Plans + 1 test plan
- 4 Email Templates, 1 SMTP Config
- 2 Provider-Patient relations (solo 1 explícita)

### Lo que FALTA (todo lo de Fases 1-6):
- **Providers multi-disciplina** (solo hay dentistas)
- **Pacientes variados** (solo 2, sin datos de salud completos)
- **Citas** (0 appointments)
- **Consentimientos** (0 consents)
- **Documentos compartidos / Exámenes médicos** (0)
- **Clinic Admin + ClinicStaff** (0)
- **ChatbotConfig** (0)
- **Datos de módulos de especialidad** (0 de 15 modelos)

---

## Plan de Semillas

### Fase A: Nuevos Providers Multi-Disciplina (8 nuevos)

| # | Email | Nombre | Especialidad | Tenant | Notas |
|---|-------|--------|-------------|--------|-------|
| P1 | `medgeneral@medicloud.com` | Dra. Ana Mejía | GENERAL_MEDICINE | MediCentro (nuevo) | Medicina general |
| P2 | `psicologo@medicloud.com` | Dr. Carlos Pérez | PSYCHOLOGY | MediCentro | Psicólogo clínico |
| P3 | `fisio@medicloud.com` | Dra. Laura Torres | PHYSIOTHERAPY | RehabPlus (nuevo) | Fisioterapeuta |
| P4 | `dermatologo@medicloud.com` | Dr. Marcos Ruiz | DERMATOLOGY | MediCentro | Dermatólogo |
| P5 | `oftalmologo@medicloud.com` | Dra. Sofía Vega | OPHTHALMOLOGY | VisiónTotal (nuevo) | Oftalmóloga |
| P6 | `cardiologo@medicloud.com` | Dr. Andrés Gómez | CARDIOLOGY | MediCentro | Cardiólogo |
| P7 | `pediatra@medicloud.com` | Dra. Isabel Moreno | PEDIATRICS | PediCare (nuevo) | Pediatra |
| P8 | `nutricionista@medicloud.com` | Lic. Diana Castro | NUTRITION | MediCentro | Nutricionista |
| P9 | `ginecologa@medicloud.com` | Dra. Valentina Ríos | GYNECOLOGY | MediCentro | Ginecóloga |

**Password universal nuevos providers:** `Provider123!`

### Fase B: Nuevos Tenants Multi-Disciplina (4 nuevos)

| # | Subdomain | Nombre | Plan | Estado | Owner |
|---|-----------|--------|------|--------|-------|
| T6 | `medicentro` | MediCentro Integral | ENTERPRISE | ACTIVE | Dra. Ana Mejía |
| T7 | `rehabplus` | RehabPlus Fisioterapia | PROFESSIONAL | ACTIVE | Dra. Laura Torres |
| T8 | `visiontotal` | VisiónTotal Oftalmología | STARTER | TRIAL | Dra. Sofía Vega |
| T9 | `pedicare` | PediCare Pediatría | PROFESSIONAL | ACTIVE | Dra. Isabel Moreno |

### Fase C: Nuevos Pacientes (6 nuevos, 8 total)

| # | Email | Nombre | Edad | Género | Datos clave |
|---|-------|--------|------|--------|-------------|
| PA1 | *(existente)* | Jane Doe | 35 | F | Ya tiene portal, alergia a Penicillin |
| PA2 | *(existente)* | John Smith | 40 | M | Ya tiene portal, cirugía previa |
| PA3 | `maria.santos@mail.com` | María Santos | 28 | F | Embarazada 32 semanas, tipo O+ |
| PA4 | `pedro.ramirez@mail.com` | Pedro Ramírez | 55 | M | Hipertenso, diabético tipo 2, cardiopatía |
| PA5 | `lucia.fernandez@mail.com` | Lucía Fernández | 8 | F | Paciente pediátrica, asma |
| PA6 | `roberto.diaz@mail.com` | Roberto Díaz | 42 | M | Lesión de rodilla, deportista |
| PA7 | `carmen.lopez@mail.com` | Carmen López | 65 | F | Glaucoma, cataratas, hipertensión |
| PA8 | `andres.martinez@mail.com` | Andrés Martínez | 35 | M | Dermatitis, ansiedad, sobrepeso |

**Password pacientes con portal:** `Patient123!` (PA3-PA8 todos con portalEnabled: true)

### Fase D: Clinic Admin + Clínica Multi-Disciplina (1 nuevo)

| Item | Dato |
|------|------|
| Clínica nueva | "Centro Médico Integrado" (multi-disciplina) |
| Admin | `clinicadmin@medicloud.com` / `ClinicAdmin123!` / Role: CLINIC_ADMIN |
| 3 Consultorios | Consultorio General, Consultorio Fisioterapia, Consultorio Oftalmología |
| 3 ClinicStaff | 1 RECEPTIONIST, 1 ADMIN, 1 MAINTENANCE |
| Room Assignments | Providers asignados a rooms con horarios |

### Fase E: Consentimientos y Relaciones (12+)

| Paciente | Provider | Status | Access Level |
|----------|----------|--------|-------------|
| María Santos | Dra. Mejía (Med General) | GRANTED | FULL |
| María Santos | Dra. Ríos (Ginecología) | GRANTED | CLINICAL_ONLY |
| María Santos | Lic. Castro (Nutrición) | PENDING | SCHEDULING_ONLY |
| Pedro Ramírez | Dr. Gómez (Cardiología) | GRANTED | FULL |
| Pedro Ramírez | Dra. Mejía (Med General) | GRANTED | CLINICAL_ONLY |
| Pedro Ramírez | Lic. Castro (Nutrición) | GRANTED | CLINICAL_ONLY |
| Lucía Fernández | Dra. Moreno (Pediatría) | GRANTED | FULL |
| Lucía Fernández | Lic. Castro (Nutrición) | PENDING | MINIMAL |
| Roberto Díaz | Dra. Torres (Fisioterapia) | GRANTED | FULL |
| Carmen López | Dra. Vega (Oftalmología) | GRANTED | FULL |
| Carmen López | Dr. Gómez (Cardiología) | GRANTED | CLINICAL_ONLY |
| Andrés Martínez | Dr. Ruiz (Dermatología) | GRANTED | FULL |
| Andrés Martínez | Dr. Pérez (Psicología) | GRANTED | CLINICAL_ONLY |
| Andrés Martínez | Lic. Castro (Nutrición) | GRANTED | CLINICAL_ONLY |
| Jane Doe | Dr. Smith (Dental) | GRANTED | FULL |

### Fase F: Citas (15+)

Citas variadas por disciplina con diferentes estados:

| Paciente | Provider | Estado | Fecha | Procedimiento |
|----------|----------|--------|-------|---------------|
| Jane Doe | Dr. Smith | COMPLETED | -30 días | Limpieza dental |
| Jane Doe | Dr. Smith | SCHEDULED | +7 días | Control semestral |
| María Santos | Dra. Mejía | COMPLETED | -14 días | Consulta prenatal |
| María Santos | Dra. Ríos | SCHEDULED | +3 días | Ecografía 33 sem |
| Pedro Ramírez | Dr. Gómez | COMPLETED | -7 días | Evaluación cardíaca |
| Pedro Ramírez | Dra. Mejía | COMPLETED | -21 días | Consulta general |
| Pedro Ramírez | Lic. Castro | SCHEDULED | +1 día | Plan nutricional |
| Lucía Fernández | Dra. Moreno | COMPLETED | -10 días | Control pediátrico |
| Lucía Fernández | Dra. Moreno | SCHEDULED | +14 días | Vacunación |
| Roberto Díaz | Dra. Torres | COMPLETED | -5 días | Evaluación funcional |
| Roberto Díaz | Dra. Torres | IN_PROGRESS | hoy | Sesión fisioterapia |
| Carmen López | Dra. Vega | COMPLETED | -3 días | Examen oftalmológico |
| Andrés Martínez | Dr. Ruiz | COMPLETED | -12 días | Evaluación dermatológica |
| Andrés Martínez | Dr. Pérez | COMPLETED | -8 días | Sesión terapia |
| Andrés Martínez | Lic. Castro | COMPLETED | -15 días | Evaluación nutricional |

### Fase G: Datos Clínicos por Módulo de Especialidad

#### G1. Dental (Dr. Smith → Jane Doe, John Smith)
- **1 Odontograma** con 5 dientes con condiciones (caries, corona, ausente, etc.)
- **1 TreatmentPlan** con 3 items (limpieza, extracción, corona) - status ACTIVE, 40% progreso

#### G2. Medicina General (Dra. Mejía → María Santos, Pedro Ramírez)
- **2 ClinicalNotes** (SOAP format):
  - María: Consulta prenatal semana 32, vitales normales, edema leve
  - Pedro: Consulta control HTA + DM2, vitales con PA 140/90
- **2 Prescriptions**:
  - María: Ácido fólico 5mg, Hierro 325mg
  - Pedro: Losartán 50mg, Metformina 850mg, Atorvastatina 20mg

#### G3. Psicología (Dr. Pérez → Andrés Martínez)
- **3 TherapySessions** (sesiones 1-3):
  - Sesión 1: INDIVIDUAL, TCC + mindfulness, mood 4/10, riskLevel LOW
  - Sesión 2: INDIVIDUAL, exposición gradual, mood 5/10, riskLevel NONE
  - Sesión 3: INDIVIDUAL, reestructuración cognitiva, mood 6/10, riskLevel NONE
- **2 PsychologicalAssessments**:
  - PHQ-9: score 14 (Moderate), respuestas detalladas
  - GAD-7: score 12 (Moderate), respuestas detalladas

#### G4. Fisioterapia (Dra. Torres → Roberto Díaz)
- **1 ExercisePlan**: "Rehabilitación rodilla derecha" con 4 ejercicios (cuádriceps, isquiotibiales, balance, estiramiento), 3x/semana, status ACTIVE
- **1 FunctionalAssessment**: INITIAL, ROM rodilla derecha 0-110°, painScale 6, functionalScore 55, goals: "Caminar sin dolor", "Retornar al deporte"

#### G5. Dermatología (Dr. Ruiz → Andrés Martínez)
- **2 SkinLesions**:
  - Lesión 1: PLAQUE en codo izquierdo, 3x2cm, dermatitis atópica, status MONITORING
  - Lesión 2: MACULE en mejilla derecha, 0.5cm, lentigo solar, biopsy: false, status ACTIVE

#### G6. Oftalmología (Dra. Vega → Carmen López)
- **1 EyeExam**: COMPREHENSIVE, VA OD 20/40, VA OI 20/50, PIO OD 22mmHg, PIO OI 24mmHg (elevada), diagnóstico: sospecha de glaucoma + cataratas incipientes
- **1 LensPrescription**: OD -2.25 -0.75 x 180, OI -2.50 -1.00 x 175, tipo GLASSES, material: policarbonato, coatings: ["antireflejo", "UV"]

#### G7. Cardiología (Dr. Gómez → Pedro Ramírez)
- **1 CardiacAssessment**: PA 140/90, FC 78, ritmo REGULAR, ECG: "Hipertrofia ventricular izquierda leve", lipidPanel: {colTotal: 240, LDL: 160, HDL: 42, triglycerides: 200}, riskFactors: ["HTA", "DM2", "Dislipidemia", "Sedentarismo"], riskScore: "MODERATE"

#### G8. Pediatría (Dra. Moreno → Lucía Fernández)
- **3 GrowthRecords** (a 6, 7, 8 años):
  - 8 años: peso 25kg, talla 128cm, perímetro cefálico 52cm, BMI 15.3, percentiles todos entre 50-75
  - 7 años: peso 22kg, talla 122cm, percentiles 50
  - 6 años: peso 19.5kg, talla 115cm, percentiles 50
- **4 VaccinationRecords**:
  - Influenza 2025, dosis 1, site: "Deltoides izquierdo"
  - Varicela 2da dosis, "Deltoides derecho"
  - Hepatitis A refuerzo, "Deltoides izquierdo"
  - DPT refuerzo, "Deltoides derecho"

#### G9. Nutrición (Lic. Castro → Andrés Martínez, Pedro Ramírez)
- **2 NutritionPlans**:
  - Andrés: "Plan de reducción de peso" 1800 kcal, macros: {protein: 30%, carbs: 40%, fat: 30%}, restricciones: ["Azúcar refinada", "Frituras"], 4 comidas/día
  - Pedro: "Plan diabético cardiosaludable" 1600 kcal, macros: {protein: 25%, carbs: 45%, fat: 30%}, restricciones: ["Sodio alto", "Azúcar", "Grasas trans"], 5 comidas/día
- **2 BodyMeasurements**:
  - Andrés: peso 92kg, talla 175cm, BMI 30.0, grasa 28%, cintura 98cm, cadera 104cm
  - Pedro: peso 85kg, talla 170cm, BMI 29.4, grasa 32%, cintura 102cm, cadera 100cm

#### G10. Ginecología (Dra. Ríos → María Santos)
- **1 GynecologicalExam**: PRENATAL, FUM hace 32 semanas, ciclo 28 días regular, método anticonceptivo "Ninguno", pregnancyHistory: {G: 2, P: 1, A: 0}, currentPregnancy: {weeks: 32, weight: 68, bloodPressure: "120/75", fetalHeartRate: 145}, PAP: "Normal (hace 8 meses)", ecografía: "Crecimiento adecuado, líquido amniótico normal"

### Fase H: Medical Exams y Documentos Compartidos

- **3 MedicalExams**:
  - Pedro: "Electrocardiograma" + "Hemoglobina glicada"
  - Carmen: "Campimetría visual"
- **2 SharedDocuments**: Pedro comparte ECG con Dr. Gómez; Carmen comparte campimetría con Dra. Vega

### Fase I: ChatbotConfig (2)

- **Tenant MediCentro**: chatbot activo, welcomeMessage personalizado, 3 FAQs, channels: ["whatsapp", "webchat"], horarios configurados
- **Tenant drsmith**: chatbot activo, configuración básica

---

## Estructura del Archivo Seed

El seed se organizará en secciones modulares dentro de `seed.ts`:

```
seed.ts
├── Passwords hashing
├── SECCIÓN 1: Users (existentes + nuevos providers multi-disciplina)
├── SECCIÓN 2: Tenants (existentes + nuevos)
├── SECCIÓN 3: Tenant Memberships
├── SECCIÓN 4: Patients (existentes + 6 nuevos con perfiles de salud completos)
├── SECCIÓN 5: Clínicas + Consultorios + Room Assignments
├── SECCIÓN 6: Clinic Staff
├── SECCIÓN 7: Provider-Patient Relations + Consents
├── SECCIÓN 8: Appointments (15+ multi-disciplina)
├── SECCIÓN 9: Datos clínicos por módulo
│   ├── 9.1 Dental (odontogram + treatment plan)
│   ├── 9.2 Medicina General (clinical notes + prescriptions)
│   ├── 9.3 Psicología (therapy sessions + assessments)
│   ├── 9.4 Fisioterapia (exercise plans + functional assessments)
│   ├── 9.5 Dermatología (skin lesions)
│   ├── 9.6 Oftalmología (eye exams + lens prescriptions)
│   ├── 9.7 Cardiología (cardiac assessments)
│   ├── 9.8 Pediatría (growth records + vaccination records)
│   ├── 9.9 Nutrición (nutrition plans + body measurements)
│   └── 9.10 Ginecología (gynecological exams)
├── SECCIÓN 10: Medical Exams + Shared Documents
├── SECCIÓN 11: Chatbot Configs
├── SECCIÓN 12: Subscription Plans + Email Templates (existentes)
├── SECCIÓN 13: SMTP Config (existente)
└── Resumen de credenciales
```

## Resumen de Entidades a Crear

| Categoría | Existentes | Nuevos | Total |
|-----------|-----------|--------|-------|
| Users | 9 | 10 (9 providers + 1 clinic admin) | 19 |
| Tenants | 5 | 4 | 9 |
| Patients | 2 | 6 | 8 |
| Clinics | 1 | 1 | 2 |
| Consultation Rooms | 1 | 3 | 4 |
| Room Assignments | 1 | 3 | 4 |
| Clinic Staff | 0 | 3 | 3 |
| Appointments | 0 | 15 | 15 |
| Consents | 0 | 15 | 15 |
| Provider-Patient Relations | 1 | 14 | 15 |
| Chatbot Configs | 0 | 2 | 2 |
| Clinical Notes | 0 | 2 | 2 |
| Prescriptions | 0 | 2 | 2 |
| Therapy Sessions | 0 | 3 | 3 |
| Psych Assessments | 0 | 2 | 2 |
| Exercise Plans | 0 | 1 | 1 |
| Functional Assessments | 0 | 1 | 1 |
| Skin Lesions | 0 | 2 | 2 |
| Eye Exams | 0 | 1 | 1 |
| Lens Prescriptions | 0 | 1 | 1 |
| Cardiac Assessments | 0 | 1 | 1 |
| Growth Records | 0 | 3 | 3 |
| Vaccination Records | 0 | 4 | 4 |
| Nutrition Plans | 0 | 2 | 2 |
| Body Measurements | 0 | 2 | 2 |
| Gynecological Exams | 0 | 1 | 1 |
| Medical Exams | 0 | 3 | 3 |
| Shared Documents | 0 | 2 | 2 |
| **TOTAL NUEVAS ENTIDADES** | | **~100** | |

## Credenciales de Acceso (Referencia Rápida)

### Existentes (sin cambios)
| Rol | Email | Password |
|-----|-------|----------|
| Super Admin | admin@dentista.com | Admin123! |
| Dentista 1 | dentist@dentista.com | Dentist123! |
| Dentista 2 | dentist2@dentista.com | Dentist456! |
| Dentista 3 | dentist3@dentista.com | Dentist789! |
| Staff 1 | staff@dentista.com | Staff123! |
| Staff 2 | staff2@dentista.com | Staff456! |
| Asistente | assistant@dentista.com | Assistant123! |
| Paciente 1 | patient@dentista.com | Patient123! |
| Paciente 2 | patient2@dentista.com | Patient456! |

### Nuevos Providers
| Especialidad | Email | Password |
|-------------|-------|----------|
| Medicina General | medgeneral@medicloud.com | Provider123! |
| Psicología | psicologo@medicloud.com | Provider123! |
| Fisioterapia | fisio@medicloud.com | Provider123! |
| Dermatología | dermatologo@medicloud.com | Provider123! |
| Oftalmología | oftalmologo@medicloud.com | Provider123! |
| Cardiología | cardiologo@medicloud.com | Provider123! |
| Pediatría | pediatra@medicloud.com | Provider123! |
| Nutrición | nutricionista@medicloud.com | Provider123! |
| Ginecología | ginecologa@medicloud.com | Provider123! |

### Nuevo Clinic Admin
| Rol | Email | Password |
|-----|-------|----------|
| Clinic Admin | clinicadmin@medicloud.com | ClinicAdmin123! |

### Nuevos Pacientes (con portal)
| Paciente | Email | Password |
|----------|-------|----------|
| María Santos | maria.santos@mail.com | Patient123! |
| Pedro Ramírez | pedro.ramirez@mail.com | Patient123! |
| Lucía Fernández | lucia.fernandez@mail.com | Patient123! |
| Roberto Díaz | roberto.diaz@mail.com | Patient123! |
| Carmen López | carmen.lopez@mail.com | Patient123! |
| Andrés Martínez | andres.martinez@mail.com | Patient123! |

---

## Escenarios de Prueba que Habilitan las Semillas

### 1. Portal del Paciente
- **María Santos**: puede ver dashboard con métricas, gestionar consentimientos (1 pendiente de Nutrición), ver exámenes ginecológicos y notas clínicas
- **Pedro Ramírez**: paciente multi-disciplina (cardio + med general + nutrición), puede ver sus prescripciones, evaluación cardíaca, plan nutricional
- **Carmen López**: puede ver examen oftalmológico, prescripción de lentes, compartir campimetría

### 2. Provider por Especialidad
- Login como cada provider → ver solo pacientes con consent activo → crear/editar datos de su módulo

### 3. Clinic Admin
- Login como clinicadmin → gestionar consultorios, staff, asignaciones, ver reportes de ocupación

### 4. Multi-tenancy
- Verificar aislamiento: provider de MediCentro NO ve pacientes de drsmith
- Enterprise tenant (MediCentro) tiene acceso a todos los módulos

### 5. Módulos Activos
- Cada provider solo ve tabs relevantes a su especialidad
- Pacientes multi-disciplina muestran múltiples tabs según los providers que los atienden
