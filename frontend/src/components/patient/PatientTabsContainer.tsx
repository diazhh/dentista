import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { usePatientTabs } from '../../hooks/usePatientTabs';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  CreditCard,
  FolderOpen,
  ClipboardList,
  Smile,
  Stethoscope,
  FileText,
  Pill,
  Brain,
  BarChart2,
  Dumbbell,
  Activity,
  Scan,
  Eye,
  Glasses,
  HeartPulse,
  Ruler,
  Syringe,
  Apple,
  Scale,
  Baby,
} from 'lucide-react';

// Icon map for dynamic rendering based on iconName string
const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard className="h-4 w-4" />,
  'calendar': <Calendar className="h-4 w-4" />,
  'dollar-sign': <DollarSign className="h-4 w-4" />,
  'credit-card': <CreditCard className="h-4 w-4" />,
  'folder-open': <FolderOpen className="h-4 w-4" />,
  'clipboard-list': <ClipboardList className="h-4 w-4" />,
  'smile': <Smile className="h-4 w-4" />,
  'stethoscope': <Stethoscope className="h-4 w-4" />,
  'file-text': <FileText className="h-4 w-4" />,
  'pill': <Pill className="h-4 w-4" />,
  'brain': <Brain className="h-4 w-4" />,
  'bar-chart-2': <BarChart2 className="h-4 w-4" />,
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
};

interface PatientTabsContainerProps {
  patientId: string;
}

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ModulesLoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Cargando modulos...</span>
      </div>
    </div>
  );
}

export default function PatientTabsContainer({ patientId }: PatientTabsContainerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'summary';
  const { tabs, isLoading } = usePatientTabs();

  // Dynamically set grid columns based on number of tabs
  const gridColsClass = useMemo(() => {
    const count = tabs.length;
    if (count <= 4) return 'grid-cols-4';
    if (count <= 6) return 'grid-cols-3 sm:grid-cols-6';
    if (count <= 8) return 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-8';
    if (count <= 10) return 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-10';
    return 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-12';
  }, [tabs.length]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  if (isLoading) {
    return <ModulesLoadingState />;
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className={`grid ${gridColsClass} gap-1 sm:gap-2 h-auto p-1`}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1"
          >
            <span className="hidden lg:inline">{iconMap[tab.iconName]}</span>
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

      {tabs.map((tab) => {
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
