import { lazy, ComponentType } from 'react';

export interface ModuleTabDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  icon: string; // lucide icon name or emoji
  component: ComponentType<{ patientId: string }>;
  order: number;
}

export interface ModuleRegistryEntry {
  key: string;
  name: string;
  patientTabs: ModuleTabDefinition[];
}

// Lazy-loaded tab components for each module
const dentalModule: ModuleRegistryEntry = {
  key: 'dental',
  name: 'Odontologia',
  patientTabs: [
    {
      id: 'odontograms',
      label: 'Odontogramas',
      shortLabel: 'Odont.',
      icon: 'smile',
      component: lazy(() => import('../components/modules/dental/OdontogramsTab')),
      order: 10,
    },
    {
      id: 'treatments',
      label: 'Tratamientos',
      shortLabel: 'Trat.',
      icon: 'clipboard-list',
      component: lazy(() => import('../components/modules/dental/TreatmentPlansTab')),
      order: 11,
    },
    {
      id: 'periodontal',
      label: 'Periodoncia',
      shortLabel: 'Perio',
      icon: 'git-branch',
      component: lazy(() => import('../components/modules/dental/PeriodontalChartTab')),
      order: 12,
    },
    {
      id: 'dental-images',
      label: 'Imagenes',
      shortLabel: 'Img.',
      icon: 'image',
      component: lazy(() => import('../components/modules/dental/DentalImagesTab')),
      order: 13,
    },
    {
      id: 'lab-cases',
      label: 'Laboratorio',
      shortLabel: 'Lab.',
      icon: 'package',
      component: lazy(() => import('../components/modules/dental/LabCasesTab')),
      order: 14,
    },
    {
      id: 'recall',
      label: 'Recall',
      icon: 'bell',
      component: lazy(() => import('../components/modules/dental/RecallTab')),
      order: 15,
    },
    {
      id: 'procedure-consent',
      label: 'Consentimientos',
      shortLabel: 'Cons.',
      icon: 'file-check',
      component: lazy(() => import('../components/modules/dental/ProcedureConsentTab')),
      order: 16,
    },
  ],
};

const generalMedicineModule: ModuleRegistryEntry = {
  key: 'general-medicine',
  name: 'Medicina General',
  patientTabs: [
    {
      id: 'clinical-notes',
      label: 'Notas Clinicas',
      shortLabel: 'Notas',
      icon: 'file-text',
      component: lazy(() => import('../components/modules/general-medicine/ClinicalNotesTab')),
      order: 10,
    },
    {
      id: 'prescriptions',
      label: 'Recetas',
      icon: 'pill',
      component: lazy(() => import('../components/modules/general-medicine/PrescriptionsTab')),
      order: 11,
    },
  ],
};

const psychologyModule: ModuleRegistryEntry = {
  key: 'psychology',
  name: 'Psicologia',
  patientTabs: [
    {
      id: 'sessions',
      label: 'Sesiones',
      icon: 'brain',
      component: lazy(() => import('../components/modules/psychology/SessionsTab')),
      order: 10,
    },
    {
      id: 'assessments',
      label: 'Evaluaciones',
      shortLabel: 'Eval.',
      icon: 'bar-chart-2',
      component: lazy(() => import('../components/modules/psychology/AssessmentsTab')),
      order: 11,
    },
  ],
};

const physiotherapyModule: ModuleRegistryEntry = {
  key: 'physiotherapy',
  name: 'Fisioterapia',
  patientTabs: [
    {
      id: 'exercise-plans',
      label: 'Ejercicios',
      shortLabel: 'Ejer.',
      icon: 'dumbbell',
      component: lazy(() => import('../components/modules/physiotherapy/ExercisePlansTab')),
      order: 10,
    },
    {
      id: 'functional-assessments',
      label: 'Evaluacion Funcional',
      shortLabel: 'Eval.',
      icon: 'activity',
      component: lazy(() => import('../components/modules/physiotherapy/FunctionalAssessmentsTab')),
      order: 11,
    },
  ],
};

const dermatologyModule: ModuleRegistryEntry = {
  key: 'dermatology',
  name: 'Dermatologia',
  patientTabs: [
    {
      id: 'skin-lesions',
      label: 'Lesiones',
      icon: 'scan',
      component: lazy(() => import('../components/modules/dermatology/SkinLesionsTab')),
      order: 10,
    },
  ],
};

const ophthalmologyModule: ModuleRegistryEntry = {
  key: 'ophthalmology',
  name: 'Oftalmologia',
  patientTabs: [
    {
      id: 'eye-exams',
      label: 'Examenes Oculares',
      shortLabel: 'Ojos',
      icon: 'eye',
      component: lazy(() => import('../components/modules/ophthalmology/EyeExamsTab')),
      order: 10,
    },
    {
      id: 'lens-prescriptions',
      label: 'Receta Optica',
      shortLabel: 'Lentes',
      icon: 'glasses',
      component: lazy(() => import('../components/modules/ophthalmology/LensPrescriptionsTab')),
      order: 11,
    },
  ],
};

const cardiologyModule: ModuleRegistryEntry = {
  key: 'cardiology',
  name: 'Cardiologia',
  patientTabs: [
    {
      id: 'cardiac-assessments',
      label: 'Evaluacion Cardiaca',
      shortLabel: 'Cardio',
      icon: 'heart-pulse',
      component: lazy(() => import('../components/modules/cardiology/CardiacAssessmentsTab')),
      order: 10,
    },
  ],
};

const pediatricsModule: ModuleRegistryEntry = {
  key: 'pediatrics',
  name: 'Pediatria',
  patientTabs: [
    {
      id: 'growth-records',
      label: 'Crecimiento',
      icon: 'ruler',
      component: lazy(() => import('../components/modules/pediatrics/GrowthRecordsTab')),
      order: 10,
    },
    {
      id: 'vaccination-records',
      label: 'Vacunas',
      icon: 'syringe',
      component: lazy(() => import('../components/modules/pediatrics/VaccinationRecordsTab')),
      order: 11,
    },
  ],
};

const nutritionModule: ModuleRegistryEntry = {
  key: 'nutrition',
  name: 'Nutricion',
  patientTabs: [
    {
      id: 'nutrition-plans',
      label: 'Plan Alimentario',
      shortLabel: 'Dieta',
      icon: 'apple',
      component: lazy(() => import('../components/modules/nutrition/NutritionPlansTab')),
      order: 10,
    },
    {
      id: 'body-measurements',
      label: 'Medidas',
      icon: 'scale',
      component: lazy(() => import('../components/modules/nutrition/BodyMeasurementsTab')),
      order: 11,
    },
  ],
};

const gynecologyModule: ModuleRegistryEntry = {
  key: 'gynecology',
  name: 'Ginecologia',
  patientTabs: [
    {
      id: 'gynecological-exams',
      label: 'Examen Ginecologico',
      shortLabel: 'Gineco',
      icon: 'baby',
      component: lazy(() => import('../components/modules/gynecology/GynecologicalExamsTab')),
      order: 10,
    },
  ],
};

export const moduleRegistry: Record<string, ModuleRegistryEntry> = {
  dental: dentalModule,
  'general-medicine': generalMedicineModule,
  psychology: psychologyModule,
  physiotherapy: physiotherapyModule,
  dermatology: dermatologyModule,
  ophthalmology: ophthalmologyModule,
  cardiology: cardiologyModule,
  pediatrics: pediatricsModule,
  nutrition: nutritionModule,
  gynecology: gynecologyModule,
};
