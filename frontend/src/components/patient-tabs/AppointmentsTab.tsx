import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, FileText } from 'lucide-react';
import api from '../../services/api';

interface Appointment {
  id: string;
  appointmentDate: string;
  duration: number;
  status: string;
  procedureType: string;
  notes?: string;
  clinicalNoteComplete?: boolean;
  procedures?: { id: string }[];
}

interface Props {
  patientId: string;
}

const PAGE_SIZE = 10;

const PROCEDURE_LABELS: Record<string, string> = {
  CHECKUP: 'Revision', CLEANING: 'Limpieza', FILLING: 'Obturacion', ROOT_CANAL: 'Endodoncia',
  EXTRACTION: 'Extraccion', CROWN: 'Corona', BRIDGE: 'Puente', IMPLANT: 'Implante',
  WHITENING: 'Blanqueamiento', SCALING: 'Raspado', SEALANT: 'Sellante', XRAY: 'Radiografia',
  ORTHODONTICS: 'Ortodoncia', VENEER: 'Carilla', INLAY_ONLAY: 'Inlay/Onlay', OTHER: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No Asistio',
};

export default function PatientAppointmentsTab({ patientId }: Props) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, [patientId, page]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments', {
        params: { patientId, page, pageSize: PAGE_SIZE },
      });
      const result = response.data;
      if (result.data) {
        setAppointments(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setAppointments(result);
        setTotalPages(1);
        setTotal(result.length);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Citas del Paciente</h2>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-sm text-muted-foreground">{total} citas</span>
          )}
          <Button>Nueva Cita</Button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay citas registradas para este paciente
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                onClick={() => navigate(`/appointments/${appointment.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {PROCEDURE_LABELS[appointment.procedureType] || appointment.procedureType}
                        {appointment.clinicalNoteComplete && (
                          <span title="Nota SOAP completa">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </span>
                        )}
                        {(appointment.procedures?.length ?? 0) > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-normal">
                            {appointment.procedures!.length} proc.
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          {formatTime(appointment.appointmentDate)} ({appointment.duration} min)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(appointment.status)}>
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
                {appointment.notes && (
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{appointment.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
