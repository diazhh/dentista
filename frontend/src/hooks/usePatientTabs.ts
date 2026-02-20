import { useMemo, ComponentType } from 'react';
import { useActiveModules } from './useActiveModules';
import { moduleRegistry } from '../modules/registry';

// Core tabs (always available) - eagerly imported
import SummaryTab from '../components/patient-tabs/SummaryTab';
import AppointmentsTab from '../components/patient-tabs/AppointmentsTab';
import InvoicesTab from '../components/patient-tabs/InvoicesTab';
import PaymentsTab from '../components/patient-tabs/PaymentsTab';
import DocumentsTab from '../components/patient-tabs/DocumentsTab';
import MedicalHistoryTab from '../components/patient-tabs/MedicalHistoryTab';

export interface TabDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  iconName: string; // lucide icon name
  component: ComponentType<{ patientId: string }>;
  order: number;
  isModuleTab: boolean;
}

const coreTabs: TabDefinition[] = [
  { id: 'summary', label: 'Resumen', iconName: 'layout-dashboard', component: SummaryTab, order: 0, isModuleTab: false },
  { id: 'appointments', label: 'Citas', iconName: 'calendar', component: AppointmentsTab, order: 1, isModuleTab: false },
  { id: 'invoices', label: 'Facturas', iconName: 'dollar-sign', component: InvoicesTab, order: 3, isModuleTab: false },
  { id: 'payments', label: 'Pagos', iconName: 'credit-card', component: PaymentsTab, order: 4, isModuleTab: false },
  { id: 'documents', label: 'Documentos', shortLabel: 'Docs', iconName: 'folder-open', component: DocumentsTab, order: 5, isModuleTab: false },
  { id: 'medical', label: 'Historia Medica', shortLabel: 'Medica', iconName: 'clipboard-list', component: MedicalHistoryTab, order: 6, isModuleTab: false },
];

export function usePatientTabs() {
  const { activeModules, isLoading } = useActiveModules();

  const tabs = useMemo(() => {
    // Start with core tabs
    const allTabs: TabDefinition[] = [...coreTabs];

    // Add module tabs for each active module
    for (const activeModule of activeModules) {
      const registryEntry = moduleRegistry[activeModule.moduleKey];
      if (registryEntry) {
        for (const moduleTab of registryEntry.patientTabs) {
          allTabs.push({
            id: moduleTab.id,
            label: moduleTab.label,
            shortLabel: moduleTab.shortLabel,
            iconName: moduleTab.icon,
            component: moduleTab.component,
            order: moduleTab.order,
            isModuleTab: true,
          });
        }
      }
    }

    // Sort by order
    return allTabs.sort((a, b) => a.order - b.order);
  }, [activeModules]);

  return { tabs, isLoading };
}
