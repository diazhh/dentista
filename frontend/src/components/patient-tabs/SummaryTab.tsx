import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, DollarSign, FileText, Activity, AlertTriangle, Info, Plus } from 'lucide-react';

interface DashboardMetrics {
  nextAppointment?: {
    id: string;
    date: string;
    time: string;
    type: string;
    duration: number;
  };
  activeTreatments: number;
  pendingBalance: number;
  lastVisit?: string;
}

interface TimelineItem {
  id: string;
  type: 'appointment' | 'treatment' | 'payment' | 'document';
  date: string;
  title: string;
  description: string;
  icon?: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardSummary {
  metrics: DashboardMetrics;
  recentTimeline: TimelineItem[];
  alerts: Alert[];
  quickStats: {
    totalAppointments: number;
    completedTreatments: number;
    totalPaid: number;
    documentsCount: number;
  };
}

interface Props {
  patientId: string;
}

export default function PatientSummaryTab({ patientId }: Props) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [patientId]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/patients/${patientId}/dashboard/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'payment':
        return '💳';
      case 'document':
        return '📄';
      case 'treatment':
        return '🦷';
      default:
        return '📌';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No se pudo cargar el resumen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary.metrics.nextAppointment ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDate(summary.metrics.nextAppointment.date)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.metrics.nextAppointment.time} - {summary.metrics.nextAppointment.type}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin citas programadas</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.metrics.activeTreatments}</div>
            <p className="text-xs text-muted-foreground">Planes en progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.metrics.pendingBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Visita</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary.metrics.lastVisit ? (
              <div className="text-2xl font-bold">{formatDate(summary.metrics.lastVisit)}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin visitas previas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alertas y Recordatorios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentTimeline.length > 0 ? (
              <div className="space-y-4">
                {summary.recentTimeline.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className="text-2xl">{getTimelineIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Sin actividad reciente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
              <Button variant="outline" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Subir Documento
              </Button>
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Nuevo Odontograma
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Citas</span>
                <span className="font-semibold">{summary.quickStats.totalAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tratamientos Completados</span>
                <span className="font-semibold">{summary.quickStats.completedTreatments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pagado</span>
                <span className="font-semibold">
                  ${summary.quickStats.totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Documentos</span>
                <span className="font-semibold">{summary.quickStats.documentsCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
