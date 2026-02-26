import { MedicalSpecialty } from '@prisma/client';

export interface ModuleFeature {
  key: string;
  name: string;
  description: string;
}

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  compatibleSpecialties: MedicalSpecialty[];
  features: ModuleFeature[];
  models: string[];
  apiPrefix: string;
  defaultConfig: Record<string, any>;
}

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  dental: {
    key: 'dental',
    name: 'Odontologia',
    description:
      'Herramientas para practica odontologica: odontograma digital, planes de tratamiento dental, codigos CDT',
    icon: 'tooth',
    version: '1.0.0',
    compatibleSpecialties: [
      MedicalSpecialty.GENERAL_DENTISTRY,
      MedicalSpecialty.ORTHODONTICS,
      MedicalSpecialty.ENDODONTICS,
      MedicalSpecialty.PERIODONTICS,
      MedicalSpecialty.ORAL_SURGERY,
      MedicalSpecialty.PEDIATRIC_DENTISTRY,
      MedicalSpecialty.PROSTHODONTICS,
    ],
    features: [
      {
        key: 'odontogram',
        name: 'Odontograma Digital',
        description: 'Grafico interactivo dental',
      },
      {
        key: 'dental-treatment-plans',
        name: 'Planes de Tratamiento Dental',
        description: 'Planificacion con codigos CDT',
      },
    ],
    models: ['Odontogram', 'OdontogramTooth', 'TreatmentPlan', 'TreatmentPlanItem'],
    apiPrefix: '/api',
    defaultConfig: { toothNumberingSystem: 'FDI' },
  },
  'general-medicine': {
    key: 'general-medicine',
    name: 'Medicina General',
    description:
      'Notas clinicas SOAP, recetas medicas, signos vitales, diagnosticos',
    icon: 'stethoscope',
    version: '1.0.0',
    compatibleSpecialties: [
      MedicalSpecialty.GENERAL_MEDICINE,
      MedicalSpecialty.INTERNAL_MEDICINE,
      MedicalSpecialty.PEDIATRICS,
      MedicalSpecialty.CARDIOLOGY,
      MedicalSpecialty.GYNECOLOGY,
      MedicalSpecialty.OTHER,
    ],
    features: [
      {
        key: 'clinical-notes',
        name: 'Notas Clinicas SOAP',
        description: 'Registro de consultas en formato SOAP',
      },
      {
        key: 'prescriptions',
        name: 'Recetas Medicas',
        description: 'Generacion y gestion de recetas',
      },
    ],
    models: ['ClinicalNote', 'Prescription'],
    apiPrefix: '/api/modules/general-medicine',
    defaultConfig: { defaultNoteType: 'SOAP' },
  },
  psychology: {
    key: 'psychology',
    name: 'Psicologia',
    description:
      'Sesiones terapeuticas, evaluaciones psicologicas (PHQ-9, GAD-7), seguimiento de progreso',
    icon: 'brain',
    version: '1.0.0',
    compatibleSpecialties: [
      MedicalSpecialty.PSYCHOLOGY,
      MedicalSpecialty.PSYCHIATRY,
    ],
    features: [
      {
        key: 'therapy-sessions',
        name: 'Sesiones Terapeuticas',
        description: 'Registro de sesiones con mood tracking',
      },
      {
        key: 'assessments',
        name: 'Evaluaciones Psicologicas',
        description: 'Escalas PHQ-9, GAD-7 y mas',
      },
    ],
    models: ['TherapySession', 'PsychologicalAssessment'],
    apiPrefix: '/api/modules/psychology',
    defaultConfig: { defaultSessionDuration: 50, defaultSessionType: 'INDIVIDUAL' },
  },
  physiotherapy: {
    key: 'physiotherapy',
    name: 'Fisioterapia',
    description: 'Planes de ejercicios, evaluaciones funcionales, seguimiento de rehabilitacion',
    icon: 'dumbbell',
    version: '1.0.0',
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
    key: 'dermatology',
    name: 'Dermatologia',
    description: 'Registro de lesiones cutaneas, body mapping, seguimiento visual',
    icon: 'scan',
    version: '1.0.0',
    compatibleSpecialties: [MedicalSpecialty.DERMATOLOGY],
    features: [
      { key: 'skin-lesions', name: 'Lesiones Cutaneas', description: 'Registro y seguimiento de lesiones con imagenes' },
    ],
    models: ['SkinLesion'],
    apiPrefix: '/api/modules/dermatology',
    defaultConfig: {},
  },
  ophthalmology: {
    key: 'ophthalmology',
    name: 'Oftalmologia',
    description: 'Examenes oculares, presion intraocular, receta de lentes',
    icon: 'eye',
    version: '1.0.0',
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
    key: 'cardiology',
    name: 'Cardiologia',
    description: 'Evaluaciones cardiacas, ECG, ecocardiograma, perfil lipidico',
    icon: 'heart-pulse',
    version: '1.0.0',
    compatibleSpecialties: [MedicalSpecialty.CARDIOLOGY],
    features: [
      { key: 'cardiac-assessments', name: 'Evaluaciones Cardiacas', description: 'Presion arterial, ECG, eco, riesgo cardiovascular' },
    ],
    models: ['CardiacAssessment'],
    apiPrefix: '/api/modules/cardiology',
    defaultConfig: {},
  },
  pediatrics: {
    key: 'pediatrics',
    name: 'Pediatria',
    description: 'Curvas de crecimiento, vacunacion, desarrollo infantil',
    icon: 'ruler',
    version: '1.0.0',
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
    key: 'nutrition',
    name: 'Nutricion',
    description: 'Planes alimentarios, macros, medidas corporales, seguimiento',
    icon: 'apple',
    version: '1.0.0',
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
    key: 'gynecology',
    name: 'Ginecologia',
    description: 'Control ginecologico, prenatal, papanicolaou, ecografias',
    icon: 'baby',
    version: '1.0.0',
    compatibleSpecialties: [MedicalSpecialty.GYNECOLOGY],
    features: [
      { key: 'gynecological-exams', name: 'Examenes Ginecologicos', description: 'Control prenatal, PAP, ecografia, historia obstetrica' },
    ],
    models: ['GynecologicalExam'],
    apiPrefix: '/api/modules/gynecology',
    defaultConfig: {},
  },
};
