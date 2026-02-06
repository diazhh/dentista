import { Suspense, lazy, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  CreditCard,
  FolderOpen,
  ClipboardList,
  Smile,
  Stethoscope,
} from 'lucide-react';

// Core tabs (always available)
import SummaryTab from '../patient-tabs/SummaryTab';
import AppointmentsTab from '../patient-tabs/AppointmentsTab';
import TreatmentsTab from '../patient-tabs/TreatmentsTab';
import InvoicesTab from '../patient-tabs/InvoicesTab';
import PaymentsTab from '../patient-tabs/PaymentsTab';
import DocumentsTab from '../patient-tabs/DocumentsTab';
import MedicalHistoryTab from '../patient-tabs/MedicalHistoryTab';

// Module tabs (dental - loaded directly for now, will be lazy-loaded when module system is built)
import OdontogramsTab from '../modules/dental/OdontogramsTab';

interface TabDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ patientId: string }>;
  order: number;
}

interface PatientTabsContainerProps {
  patientId: string;
}

// Core tabs always visible for all providers
const coreTabs: TabDefinition[] = [
  {
    id: 'summary',
    label: 'Resumen',
    icon: <LayoutDashboard className="h-4 w-4" />,
    component: SummaryTab,
    order: 0,
  },
  {
    id: 'appointments',
    label: 'Citas',
    icon: <Calendar className="h-4 w-4" />,
    component: AppointmentsTab,
    order: 1,
  },
  {
    id: 'treatments',
    label: 'Tratamientos',
    shortLabel: 'Trat.',
    icon: <Stethoscope className="h-4 w-4" />,
    component: TreatmentsTab,
    order: 2,
  },
  {
    id: 'odontograms',
    label: 'Odontogramas',
    shortLabel: 'Odont.',
    icon: <Smile className="h-4 w-4" />,
    component: OdontogramsTab,
    order: 10,
  },
  {
    id: 'invoices',
    label: 'Facturas',
    icon: <DollarSign className="h-4 w-4" />,
    component: InvoicesTab,
    order: 3,
  },
  {
    id: 'payments',
    label: 'Pagos',
    icon: <CreditCard className="h-4 w-4" />,
    component: PaymentsTab,
    order: 4,
  },
  {
    id: 'documents',
    label: 'Documentos',
    shortLabel: 'Docs',
    icon: <FolderOpen className="h-4 w-4" />,
    component: DocumentsTab,
    order: 5,
  },
  {
    id: 'medical',
    label: 'Historia Médica',
    shortLabel: 'Médica',
    icon: <ClipboardList className="h-4 w-4" />,
    component: MedicalHistoryTab,
    order: 6,
  },
];

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function PatientTabsContainer({ patientId }: PatientTabsContainerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'summary';

  // Sort tabs by order
  const sortedTabs = useMemo(() => {
    return [...coreTabs].sort((a, b) => a.order - b.order);
  }, []);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1 sm:gap-2 h-auto p-1">
        {sortedTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1"
          >
            <span className="hidden lg:inline">{tab.icon}</span>
            {tab.shortLabel ? (
              <>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </>
            ) : (
              <span>{tab.label}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {sortedTabs.map((tab) => {
        const TabComponent = tab.component;
        return (
          <TabsContent key={tab.id} value={tab.id}>
            <Suspense fallback={<TabLoadingFallback />}>
              <TabComponent patientId={patientId} />
            </Suspense>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
