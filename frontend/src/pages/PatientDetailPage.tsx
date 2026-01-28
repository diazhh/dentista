import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, ArrowLeft, Edit, Calendar, FileText, DollarSign, User, Phone, Mail, IdCard } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patient {
  id: string;
  documentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  allergies?: string[];
  medications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  user?: {
    email: string;
  };
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'treatments' | 'invoices'>('info');

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchAppointments();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatient(response.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data.filter((apt: any) => apt.patientId === id));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-red-200 text-red-900',
    };

    const labels: Record<string, string> = {
      SCHEDULED: 'Programada',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No Asistió',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Paciente no encontrado</p>
          <button
            onClick={() => navigate('/patients')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-gray-500">Cédula: {patient.documentId}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/patients/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Editar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Información
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Citas ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'treatments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Tratamientos
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Facturas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <IdCard className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Cédula</p>
                        <p className="font-medium">{patient.documentId}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{patient.user?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                        <p className="font-medium">
                          {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Género</p>
                        <p className="font-medium">
                          {patient.gender === 'MALE' ? 'Masculino' : 'Femenino'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Alergias</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies && patient.allergies.length > 0 ? (
                          patient.allergies.map((allergy, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                            >
                              {allergy}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Ninguna</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Medicamentos</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.medications && patient.medications.length > 0 ? (
                          patient.medications.map((med, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {med}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Ninguno</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(patient.emergencyContactName || patient.emergencyContactPhone) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Contacto de Emergencia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patient.emergencyContactName && (
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium">{patient.emergencyContactName}</p>
                        </div>
                      )}
                      {patient.emergencyContactPhone && (
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <p className="font-medium">{patient.emergencyContactPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Historial de Citas</h3>
                  <button
                    onClick={() => navigate(`/appointments/new?patientId=${id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Nueva Cita
                  </button>
                </div>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(new Date(apt.startTime), "dd/MM/yyyy 'a las' HH:mm", {
                                locale: es,
                              })}
                            </p>
                            <p className="text-sm text-gray-500">{apt.type}</p>
                            {apt.notes && <p className="text-sm text-gray-600 mt-1">{apt.notes}</p>}
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay citas registradas</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Módulo de tratamientos próximamente</p>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Módulo de facturas próximamente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
