import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { patientRegistrationAPI } from '../../services/api';

type DocumentType = 'CEDULA' | 'PASAPORTE' | 'RNC' | 'OTRO';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentId: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  acceptTerms: boolean;
}

const initialForm: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  documentType: 'CEDULA',
  documentId: '',
  dateOfBirth: '',
  gender: 'MALE',
  phone: '',
  acceptTerms: false,
};

export default function PatientRegisterPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const navigate = useNavigate();

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): string | null => {
    if (!form.firstName.trim()) return 'El nombre es requerido';
    if (!form.lastName.trim()) return 'El apellido es requerido';
    if (!form.documentId.trim()) return 'El documento de identidad es requerido';
    if (!form.dateOfBirth) return 'La fecha de nacimiento es requerida';
    if (!form.phone.trim()) return 'El teléfono es requerido';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.email.trim()) return 'El correo electrónico es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Correo electrónico inválido';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden';
    if (!form.acceptTerms) return 'Debe aceptar los términos y condiciones';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await patientRegistrationAPI.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        documentId: form.documentId,
        documentType: form.documentType,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
      });
      navigate('/login', { state: { message: 'Registro exitoso. Inicia sesión con tus credenciales.' } });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">MediCloud</h1>
          <p className="mt-1 text-sm text-gray-500">Portal del Paciente</p>
          <h2 className="mt-3 text-lg font-semibold text-gray-700">Crear Cuenta</h2>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 space-x-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            <span className="text-sm font-medium hidden sm:inline">Datos Personales</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            <span className="text-sm font-medium hidden sm:inline">Cuenta</span>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.</label>
                  <select
                    value={form.documentType}
                    onChange={e => updateField('documentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RNC">RNC</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Documento *</label>
                  <input
                    type="text"
                    value={form.documentId}
                    onChange={e => updateField('documentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="001-1234567-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento *</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
                  <select
                    value={form.gender}
                    onChange={e => updateField('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="+1-809-555-1234"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
              >
                Siguiente
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Repita la contraseña"
                />
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={e => updateField('acceptTerms', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  Acepto los <span className="text-indigo-600 hover:underline cursor-pointer">términos y condiciones</span> y la <span className="text-indigo-600 hover:underline cursor-pointer">política de privacidad</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 text-sm"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
