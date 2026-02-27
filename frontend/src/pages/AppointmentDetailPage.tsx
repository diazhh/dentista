import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Calendar, Clock, User, FileText, Edit, Trash2, CheckCircle, XCircle, ArrowLeft,
  Plus, Save, Stethoscope, Pill, AlertTriangle, ClipboardList, Activity, Smile
} from 'lucide-react';
import api from '../services/api';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface Procedure {
  id: string;
  procedureType: string;
  toothNumber?: number;
  surfaces: string[];
  material?: string;
  notes?: string;
  cost: number;
  cdtCode?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  duration: number;
  status: string;
  procedureType: string;
  notes?: string;
  chiefComplaint?: string;
  painScale?: number;
  subjectiveFindings?: string;
  objectiveFindings?: string;
  assessment?: string;
  plan?: string;
  postProcedureInstructions?: string;
  followUpNotes?: string;
  vitalSigns?: { bloodPressure?: string; pulse?: number; temperature?: number };
  clinicalNoteComplete?: boolean;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    documentId: string;
    dateOfBirth?: string;
    gender?: string;
  };
  room?: { id: string; name: string; clinic?: { name: string } };
  procedures?: Procedure[];
}

const PROCEDURE_TYPES = [
  { value: 'CHECKUP', label: 'Revisión' },
  { value: 'CLEANING', label: 'Limpieza/Profilaxis' },
  { value: 'FILLING', label: 'Obturación/Empaste' },
  { value: 'ROOT_CANAL', label: 'Endodoncia' },
  { value: 'EXTRACTION', label: 'Extracción' },
  { value: 'CROWN', label: 'Corona' },
  { value: 'BRIDGE', label: 'Puente' },
  { value: 'IMPLANT', label: 'Implante' },
  { value: 'WHITENING', label: 'Blanqueamiento' },
  { value: 'SCALING', label: 'Raspado/Alisado' },
  { value: 'SEALANT', label: 'Sellante' },
  { value: 'XRAY', label: 'Radiografía' },
  { value: 'ORTHODONTICS', label: 'Ortodoncia' },
  { value: 'VENEER', label: 'Carilla' },
  { value: 'INLAY_ONLAY', label: 'Inlay/Onlay' },
  { value: 'OTHER', label: 'Otro' },
];

const MATERIALS = [
  'Composite', 'Amalgama', 'Cerámica', 'Zirconia', 'Ionómero de vidrio',
  'IRM', 'Hidróxido de calcio', 'MTA', 'Gutapercha', 'Oro',
];

const SURFACES = ['OCCLUSAL', 'MESIAL', 'DISTAL', 'BUCCAL', 'LINGUAL', 'INCISAL'];
const SURFACE_LABELS: Record<string, string> = {
  OCCLUSAL: 'O', MESIAL: 'M', DISTAL: 'D', BUCCAL: 'B', LINGUAL: 'L', INCISAL: 'I',
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [showProcedureForm, setShowProcedureForm] = useState(false);

  // SOAP form state
  const [soap, setSoap] = useState({
    chiefComplaint: '',
    painScale: 0,
    subjectiveFindings: '',
    objectiveFindings: '',
    assessment: '',
    plan: '',
    postProcedureInstructions: '',
    followUpNotes: '',
    notes: '',
    vitalSigns: { bloodPressure: '', pulse: 0, temperature: 0 },
  });

  // New procedure form
  const [newProcedure, setNewProcedure] = useState({
    procedureType: 'CHECKUP',
    toothNumber: '' as string | number,
    surfaces: [] as string[],
    material: '',
    notes: '',
    cost: 0,
    cdtCode: '',
    updateOdontogram: false,
  });

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      const apt = response.data;
      setAppointment(apt);
      setSoap({
        chiefComplaint: apt.chiefComplaint || '',
        painScale: apt.painScale || 0,
        subjectiveFindings: apt.subjectiveFindings || '',
        objectiveFindings: apt.objectiveFindings || '',
        assessment: apt.assessment || '',
        plan: apt.plan || '',
        postProcedureInstructions: apt.postProcedureInstructions || '',
        followUpNotes: apt.followUpNotes || '',
        notes: apt.notes || '',
        vitalSigns: apt.vitalSigns || { bloodPressure: '', pulse: 0, temperature: 0 },
      });
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAppointment();
  }, [id, fetchAppointment]);

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      fetchAppointment();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleSaveSoap = async () => {
    try {
      setSaving(true);
      await api.patch(`/appointments/${id}/soap`, {
        ...soap,
        painScale: soap.painScale || null,
        vitalSigns: soap.vitalSigns?.bloodPressure ? soap.vitalSigns : null,
        clinicalNoteComplete: true,
      });
      fetchAppointment();
    } catch (error) {
      console.error('Error saving SOAP:', error);
      alert('Error al guardar la nota clínica');
    } finally {
      setSaving(false);
    }
  };

  // Map procedure types to resulting tooth conditions
  const PROCEDURE_TO_CONDITION: Record<string, string> = {
    FILLING: 'FILLED', EXTRACTION: 'MISSING', ROOT_CANAL: 'ROOT_CANAL',
    CROWN: 'CROWN', BRIDGE: 'BRIDGE', IMPLANT: 'IMPLANT',
  };

  const handleAddProcedure = async () => {
    try {
      const { updateOdontogram, ...procData } = newProcedure;
      await api.post(`/appointments/${id}/procedures`, {
        ...procData,
        toothNumber: procData.toothNumber ? Number(procData.toothNumber) : undefined,
        cost: Number(procData.cost) || 0,
      });

      // Update odontogram if checkbox is checked and tooth + condition mapping exist
      if (updateOdontogram && procData.toothNumber && appointment?.patientId) {
        const newCondition = PROCEDURE_TO_CONDITION[procData.procedureType];
        if (newCondition) {
          try {
            await api.post(`/odontograms/patient/${appointment.patientId}/update-from-procedure`, {
              toothNumber: Number(procData.toothNumber),
              newCondition,
              surfaces: procData.surfaces,
              appointmentId: id,
              notes: `${getProcedureLabel(procData.procedureType)} - ${procData.notes || ''}`.trim(),
            });
          } catch (err) {
            console.error('Error updating odontogram:', err);
          }
        }
      }

      setNewProcedure({ procedureType: 'CHECKUP', toothNumber: '', surfaces: [], material: '', notes: '', cost: 0, cdtCode: '', updateOdontogram: false });
      setShowProcedureForm(false);
      fetchAppointment();
    } catch (error) {
      console.error('Error adding procedure:', error);
      alert('Error al agregar procedimiento');
    }
  };

  const handleDeleteProcedure = async (procedureId: string) => {
    if (!confirm('¿Eliminar este procedimiento?')) return;
    try {
      await api.delete(`/appointments/${id}/procedures/${procedureId}`);
      fetchAppointment();
    } catch (error) {
      console.error('Error deleting procedure:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar esta cita?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      navigate('/calendar');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error al eliminar la cita');
    }
  };

  const toggleSurface = (surface: string) => {
    setNewProcedure(prev => ({
      ...prev,
      surfaces: prev.surfaces.includes(surface)
        ? prev.surfaces.filter(s => s !== surface)
        : [...prev.surfaces, surface],
    }));
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
      SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No Asistió',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getProcedureLabel = (type: string) => {
    return PROCEDURE_TYPES.find(p => p.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Cita no encontrada</p>
          <button onClick={() => navigate('/calendar')} className="mt-4 text-blue-600 hover:underline">
            Volver al calendario
          </button>
        </div>
      </div>
    );
  }

  const endTime = addMinutes(new Date(appointment.appointmentDate), appointment.duration);

  const sections = [
    { key: 'info', label: 'Info', icon: Calendar },
    { key: 'soap', label: 'Nota SOAP', icon: Stethoscope },
    { key: 'procedures', label: 'Procedimientos', icon: ClipboardList },
    { key: 'prescriptions', label: 'Indicaciones', icon: Pill },
    { key: 'status', label: 'Estado', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3">
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cita Dental</h1>
                <p className="text-sm text-gray-500">
                  {format(new Date(appointment.appointmentDate), 'PPP', { locale: es })} - {getProcedureLabel(appointment.procedureType)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(appointment.status)}
              {appointment.clinicalNoteComplete && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  SOAP Completo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-lg border-b flex overflow-x-auto">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === s.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-4 sm:p-6">

          {/* === INFO SECTION === */}
          {activeSection === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Paciente
                  </h3>
                  {appointment.patient ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Link to={`/patients/${appointment.patient.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </Link>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Cédula: {appointment.patient.documentId}</p>
                        <p>Teléfono: {appointment.patient.phone}</p>
                        {appointment.patient.dateOfBirth && (
                          <p>Fecha de nacimiento: {format(new Date(appointment.patient.dateOfBirth), 'PP', { locale: es })}</p>
                        )}
                      </div>
                    </div>
                  ) : <p className="text-gray-500">Sin paciente asignado</p>}
                </div>

                {/* Appointment Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Detalles de la Cita
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="font-medium">{format(new Date(appointment.appointmentDate), 'PPP', { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hora:</span>
                      <span className="font-medium">
                        {format(new Date(appointment.appointmentDate), 'p', { locale: es })} - {format(endTime, 'p', { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duración:</span>
                      <span className="font-medium">{appointment.duration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="font-medium">{getProcedureLabel(appointment.procedureType)}</span>
                    </div>
                    {appointment.room && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Consultorio:</span>
                        <span className="font-medium">{appointment.room.name} {appointment.room.clinic ? `- ${appointment.room.clinic.name}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" /> Notas
                  </h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* === SOAP NOTE SECTION === */}
          {activeSection === 'soap' && (
            <div className="space-y-6">
              {/* Subjective */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">S</span>
                  Subjetivo
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Motivo de consulta</label>
                    <textarea
                      value={soap.chiefComplaint}
                      onChange={e => setSoap({...soap, chiefComplaint: e.target.value})}
                      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="¿Qué trae al paciente hoy?"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-600">Escala de dolor (0-10):</label>
                    <input
                      type="range" min="0" max="10"
                      value={soap.painScale}
                      onChange={e => setSoap({...soap, painScale: Number(e.target.value)})}
                      className="flex-1 max-w-xs"
                    />
                    <span className={`text-lg font-bold ${soap.painScale > 7 ? 'text-red-600' : soap.painScale > 4 ? 'text-amber-600' : 'text-green-600'}`}>
                      {soap.painScale}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Síntomas / Hallazgos subjetivos</label>
                    <textarea
                      value={soap.subjectiveFindings}
                      onChange={e => setSoap({...soap, subjectiveFindings: e.target.value})}
                      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Síntomas reportados por el paciente, historia del problema actual, factores agravantes/aliviadores..."
                    />
                  </div>
                </div>
              </div>

              {/* Objective */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">O</span>
                  Objetivo
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Presión arterial</label>
                      <input
                        type="text"
                        value={soap.vitalSigns?.bloodPressure || ''}
                        onChange={e => setSoap({...soap, vitalSigns: {...soap.vitalSigns, bloodPressure: e.target.value}})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="120/80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Pulso (bpm)</label>
                      <input
                        type="number"
                        value={soap.vitalSigns?.pulse || ''}
                        onChange={e => setSoap({...soap, vitalSigns: {...soap.vitalSigns, pulse: Number(e.target.value)}})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Temperatura (°C)</label>
                      <input
                        type="number" step="0.1"
                        value={soap.vitalSigns?.temperature || ''}
                        onChange={e => setSoap({...soap, vitalSigns: {...soap.vitalSigns, temperature: Number(e.target.value)}})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="36.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hallazgos al examen / Observaciones clínicas</label>
                    <textarea
                      value={soap.objectiveFindings}
                      onChange={e => setSoap({...soap, objectiveFindings: e.target.value})}
                      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Examen extraoral, intraoral, hallazgos periodontales, radiográficos, dientes examinados..."
                    />
                  </div>
                </div>
              </div>

              {/* Assessment */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">A</span>
                  Diagnóstico / Evaluación
                </h3>
                <textarea
                  value={soap.assessment}
                  onChange={e => setSoap({...soap, assessment: e.target.value})}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Diagnóstico principal, diagnósticos secundarios, códigos CIE-10..."
                />
              </div>

              {/* Plan */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">P</span>
                  Plan de Tratamiento
                </h3>
                <textarea
                  value={soap.plan}
                  onChange={e => setSoap({...soap, plan: e.target.value})}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Plan de tratamiento acordado, próximos pasos, referencias a especialistas..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSoap}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Nota Clínica'}
                </button>
              </div>
            </div>
          )}

          {/* === PROCEDURES SECTION === */}
          {activeSection === 'procedures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Procedimientos Realizados</h3>
                <button
                  onClick={() => setShowProcedureForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              {/* Procedure Form */}
              {showProcedureForm && (
                <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                  <h4 className="font-medium text-gray-800">Nuevo Procedimiento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                      <select
                        value={newProcedure.procedureType}
                        onChange={e => setNewProcedure({...newProcedure, procedureType: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        {PROCEDURE_TYPES.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Diente (FDI)</label>
                      <input
                        type="number" min="11" max="85"
                        value={newProcedure.toothNumber}
                        onChange={e => setNewProcedure({...newProcedure, toothNumber: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Ej: 36"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Código CDT</label>
                      <input
                        type="text"
                        value={newProcedure.cdtCode}
                        onChange={e => setNewProcedure({...newProcedure, cdtCode: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Ej: D2391"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Material</label>
                      <select
                        value={newProcedure.material}
                        onChange={e => setNewProcedure({...newProcedure, material: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Costo (RD$)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={newProcedure.cost}
                        onChange={e => setNewProcedure({...newProcedure, cost: Number(e.target.value)})}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Superficies</label>
                      <div className="flex gap-1 flex-wrap">
                        {SURFACES.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleSurface(s)}
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              newProcedure.surfaces.includes(s)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {SURFACE_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas del procedimiento</label>
                    <textarea
                      value={newProcedure.notes}
                      onChange={e => setNewProcedure({...newProcedure, notes: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={2}
                      placeholder="Detalles adicionales del procedimiento..."
                    />
                  </div>
                  {/* Update odontogram checkbox */}
                  {newProcedure.toothNumber && PROCEDURE_TO_CONDITION[newProcedure.procedureType] && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="updateOdontogram"
                        checked={newProcedure.updateOdontogram}
                        onChange={e => setNewProcedure({...newProcedure, updateOdontogram: e.target.checked})}
                        className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="updateOdontogram" className="text-sm text-emerald-800">
                        Actualizar estado del diente en el odontograma
                        <span className="text-xs text-emerald-600 ml-1">
                          (→ {PROCEDURE_TO_CONDITION[newProcedure.procedureType]})
                        </span>
                      </label>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowProcedureForm(false)} className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button onClick={handleAddProcedure} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Guardar Procedimiento
                    </button>
                  </div>
                </div>
              )}

              {/* Procedures List */}
              {(!appointment.procedures || appointment.procedures.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No hay procedimientos registrados</p>
                  <p className="text-sm">Haga click en "Agregar" para registrar un procedimiento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {appointment.procedures.map((proc) => (
                    <div key={proc.id} className="border rounded-lg p-3 hover:bg-gray-50 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{getProcedureLabel(proc.procedureType)}</span>
                          {proc.toothNumber && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium flex items-center gap-1">
                              <Smile className="w-3 h-3" /> #{proc.toothNumber}
                            </span>
                          )}
                          {proc.surfaces.length > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {proc.surfaces.map(s => SURFACE_LABELS[s] || s).join('')}
                            </span>
                          )}
                          {proc.cdtCode && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{proc.cdtCode}</span>
                          )}
                          {proc.material && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{proc.material}</span>
                          )}
                        </div>
                        {proc.notes && <p className="text-sm text-gray-600 mt-1">{proc.notes}</p>}
                        {proc.cost > 0 && <p className="text-sm font-medium text-gray-800 mt-1">RD$ {proc.cost.toFixed(2)}</p>}
                      </div>
                      <button onClick={() => handleDeleteProcedure(proc.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {appointment.procedures.length > 0 && (
                    <div className="border-t pt-3 flex justify-end">
                      <span className="font-semibold text-gray-800">
                        Total: RD$ {appointment.procedures.reduce((sum, p) => sum + (p.cost || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === PRESCRIPTIONS / POST-PROCEDURE === */}
          {activeSection === 'prescriptions' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Instrucciones Post-procedimiento
                </h3>
                <textarea
                  value={soap.postProcedureInstructions}
                  onChange={e => setSoap({...soap, postProcedureInstructions: e.target.value})}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Instrucciones para el paciente: cuidados en casa, medicamentos, dieta, signos de alarma..."
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" /> Seguimiento / Próxima Cita
                </h3>
                <textarea
                  value={soap.followUpNotes}
                  onChange={e => setSoap({...soap, followUpNotes: e.target.value})}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Notas de seguimiento, próxima cita programada, qué observar..."
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" /> Notas Adicionales
                </h3>
                <textarea
                  value={soap.notes}
                  onChange={e => setSoap({...soap, notes: e.target.value})}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Cualquier nota adicional sobre la cita..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSoap}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {/* === STATUS SECTION === */}
          {activeSection === 'status' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Cambiar Estado de la Cita</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { status: 'CONFIRMED', label: 'Confirmar', icon: CheckCircle, color: 'green' },
                    { status: 'IN_PROGRESS', label: 'En Progreso', icon: Clock, color: 'amber' },
                    { status: 'COMPLETED', label: 'Completar', icon: CheckCircle, color: 'gray' },
                    { status: 'CANCELLED', label: 'Cancelar', icon: XCircle, color: 'red' },
                    { status: 'NO_SHOW', label: 'No Asistió', icon: XCircle, color: 'red' },
                  ].map(({ status, label, icon: Icon, color }) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={appointment.status === status}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border border-${color}-600 text-${color}-600 rounded-lg hover:bg-${color}-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Cita
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
