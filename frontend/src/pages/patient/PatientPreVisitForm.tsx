import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Heart,
  Pill,
  AlertTriangle,
  Phone,
  FileText,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

interface PreVisitFormData {
  currentMedications: string[];
  allergiesUpdate: string[];
  medicalConditions: string[];
  recentSurgeries: string;
  chiefComplaint: string;
  painLevel: number;
  painLocation: string;
  symptomsDuration: string;
  lastDentalVisit: string;
  brushingFrequency: string;
  flossingFrequency: string;
  hasInsuranceChanges: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceGroupNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  consentGiven: boolean;
  additionalNotes: string;
}

export default function PatientPreVisitForm() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const [formData, setFormData] = useState<PreVisitFormData>({
    currentMedications: [],
    allergiesUpdate: [],
    medicalConditions: [],
    recentSurgeries: '',
    chiefComplaint: '',
    painLevel: 0,
    painLocation: '',
    symptomsDuration: '',
    lastDentalVisit: '',
    brushingFrequency: '',
    flossingFrequency: '',
    hasInsuranceChanges: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    consentGiven: false,
    additionalNotes: '',
  });

  useEffect(() => {
    if (appointmentId) {
      fetchForm();
    }
  }, [appointmentId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/portal/appointments/${appointmentId}/pre-visit-form`);
      const data = response.data;
      setFormData({
        currentMedications: data.currentMedications || [],
        allergiesUpdate: data.allergiesUpdate || [],
        medicalConditions: data.medicalConditions || [],
        recentSurgeries: data.recentSurgeries || '',
        chiefComplaint: data.chiefComplaint || '',
        painLevel: data.painLevel || 0,
        painLocation: data.painLocation || '',
        symptomsDuration: data.symptomsDuration || '',
        lastDentalVisit: data.lastDentalVisit ? data.lastDentalVisit.split('T')[0] : '',
        brushingFrequency: data.brushingFrequency || '',
        flossingFrequency: data.flossingFrequency || '',
        hasInsuranceChanges: data.hasInsuranceChanges || false,
        insuranceProvider: data.insuranceProvider || '',
        insurancePolicyNumber: data.insurancePolicyNumber || '',
        insuranceGroupNumber: data.insuranceGroupNumber || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        emergencyContactRelation: data.emergencyContactRelation || '',
        consentGiven: data.consentGiven || false,
        additionalNotes: data.additionalNotes || '',
      });
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.consentGiven) {
      setError('Debes dar tu consentimiento para enviar el formulario');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/portal/appointments/${appointmentId}/pre-visit-form`, formData);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Error al enviar el formulario');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = (field: 'currentMedications' | 'allergiesUpdate' | 'medicalConditions', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeItem = (field: 'currentMedications' | 'allergiesUpdate' | 'medicalConditions', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const steps = [
    { number: 1, title: 'Historial Médico', icon: Heart },
    { number: 2, title: 'Síntomas', icon: AlertTriangle },
    { number: 3, title: 'Hábitos', icon: ClipboardCheck },
    { number: 4, title: 'Seguro', icon: FileText },
    { number: 5, title: 'Emergencia', icon: Phone },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulario enviado</h2>
          <p className="text-gray-600 mb-6">
            Tu formulario pre-visita ha sido enviado correctamente. Tu dentista lo revisará antes de tu cita.
          </p>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Mis Citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/patient/appointments')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mis Citas
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Formulario Pre-Visita</h1>
          <p className="text-gray-600 mt-1">
            Completa este formulario antes de tu cita para agilizar tu atención
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={`flex flex-col items-center ${isActive || isCompleted ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: Medical History */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Historial Médico
              </h2>

              {/* Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicamentos actuales
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Nombre del medicamento"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('currentMedications', newMedication);
                        setNewMedication('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addItem('currentMedications', newMedication);
                      setNewMedication('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.currentMedications.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Pill className="w-3 h-3" />
                      {med}
                      <button
                        onClick={() => removeItem('currentMedications', idx)}
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alergias conocidas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Alergia (ej: penicilina, látex)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('allergiesUpdate', newAllergy);
                        setNewAllergy('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addItem('allergiesUpdate', newAllergy);
                      setNewAllergy('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergiesUpdate.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {allergy}
                      <button
                        onClick={() => removeItem('allergiesUpdate', idx)}
                        className="ml-1 hover:text-red-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones médicas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Condición (ej: diabetes, hipertensión)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('medicalConditions', newCondition);
                        setNewCondition('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addItem('medicalConditions', newCondition);
                      setNewCondition('');
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.medicalConditions.map((condition, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {condition}
                      <button
                        onClick={() => removeItem('medicalConditions', idx)}
                        className="ml-1 hover:text-purple-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Surgeries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cirugías recientes (últimos 12 meses)
                </label>
                <textarea
                  value={formData.recentSurgeries}
                  onChange={(e) => setFormData(prev => ({ ...prev, recentSurgeries: e.target.value }))}
                  placeholder="Describe cualquier cirugía reciente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Síntomas y Preocupaciones
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cuál es el motivo principal de tu visita?
                </label>
                <textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  placeholder="Describe el motivo de tu visita..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de dolor (0 = Sin dolor, 10 = Dolor severo)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.painLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className={`w-12 text-center font-bold text-lg ${
                    formData.painLevel === 0 ? 'text-green-600' :
                    formData.painLevel <= 3 ? 'text-yellow-600' :
                    formData.painLevel <= 6 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {formData.painLevel}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación del dolor
                </label>
                <input
                  type="text"
                  value={formData.painLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, painLocation: e.target.value }))}
                  placeholder="Ej: Muela inferior derecha, encías superiores..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Desde cuándo tienes los síntomas?
                </label>
                <select
                  value={formData.symptomsDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptomsDuration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="today">Hoy</option>
                  <option value="few_days">Hace unos días</option>
                  <option value="week">Una semana</option>
                  <option value="two_weeks">Dos semanas</option>
                  <option value="month">Un mes</option>
                  <option value="more">Más de un mes</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Dental Habits */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-500" />
                Hábitos de Higiene Dental
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Última visita al dentista
                </label>
                <input
                  type="date"
                  value={formData.lastDentalVisit}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastDentalVisit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Con qué frecuencia te cepillas los dientes?
                </label>
                <select
                  value={formData.brushingFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, brushingFrequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="rarely">Pocas veces a la semana</option>
                  <option value="once">Una vez al día</option>
                  <option value="twice">Dos veces al día</option>
                  <option value="three">Tres veces al día</option>
                  <option value="after_meals">Después de cada comida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Con qué frecuencia usas hilo dental?
                </label>
                <select
                  value={formData.flossingFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, flossingFrequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="never">Nunca</option>
                  <option value="rarely">Pocas veces al mes</option>
                  <option value="weekly">Una vez por semana</option>
                  <option value="few_times">Varias veces por semana</option>
                  <option value="daily">Diariamente</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Insurance */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Información de Seguro
              </h2>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasInsuranceChanges"
                  checked={formData.hasInsuranceChanges}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasInsuranceChanges: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasInsuranceChanges" className="text-sm text-gray-700">
                  Tengo cambios en mi información de seguro
                </label>
              </div>

              {formData.hasInsuranceChanges && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compañía de seguro
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      placeholder="Nombre de la aseguradora"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de póliza
                      </label>
                      <input
                        type="text"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                        placeholder="Número de póliza"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de grupo
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceGroupNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, insuranceGroupNumber: e.target.value }))}
                        placeholder="Número de grupo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Emergency Contact */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-500" />
                Contacto de Emergencia
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  placeholder="Nombre del contacto de emergencia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  placeholder="Teléfono del contacto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relación
                </label>
                <select
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="spouse">Cónyuge</option>
                  <option value="parent">Padre/Madre</option>
                  <option value="sibling">Hermano/a</option>
                  <option value="child">Hijo/a</option>
                  <option value="friend">Amigo/a</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Cualquier información adicional que debamos conocer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Consent */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData(prev => ({ ...prev, consentGiven: e.target.checked }))}
                    className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700">
                    Doy mi consentimiento para que la clínica dental utilice esta información para mi atención médica.
                    Entiendo que esta información es confidencial y será protegida de acuerdo con las leyes de privacidad aplicables.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.consentGiven}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Enviar Formulario
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
