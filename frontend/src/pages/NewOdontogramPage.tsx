import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import OdontogramChart from '../components/OdontogramChart';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
}

interface ToothData {
  toothNumber: number;
  condition: string;
  surfaces: string[];
  notes: string;
  color?: string;
}

const TOOTH_CONDITIONS = [
  { value: 'HEALTHY', label: 'Sano' },
  { value: 'CAVITY', label: 'Caries' },
  { value: 'FILLED', label: 'Obturado' },
  { value: 'CROWN', label: 'Corona' },
  { value: 'BRIDGE', label: 'Puente' },
  { value: 'IMPLANT', label: 'Implante' },
  { value: 'MISSING', label: 'Ausente' },
  { value: 'EXTRACTION_NEEDED', label: 'Extracción Necesaria' },
  { value: 'ROOT_CANAL', label: 'Endodoncia' },
  { value: 'FRACTURED', label: 'Fracturado' },
  { value: 'WORN', label: 'Desgastado' },
  { value: 'ABSCESS', label: 'Absceso' },
];

const TOOTH_SURFACES = [
  { value: 'OCCLUSAL', label: 'Oclusal (O)' },
  { value: 'MESIAL', label: 'Mesial (M)' },
  { value: 'DISTAL', label: 'Distal (D)' },
  { value: 'BUCCAL', label: 'Bucal (B)' },
  { value: 'LINGUAL', label: 'Lingual (L)' },
  { value: 'INCISAL', label: 'Incisal (I)' },
];

export default function NewOdontogramPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [notes, setNotes] = useState('');
  const [teeth, setTeeth] = useState<ToothData[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    
    // Si el diente ya existe, no hacer nada (se editará en el formulario)
    const existingTooth = teeth.find(t => t.toothNumber === toothNumber);
    if (!existingTooth) {
      // Agregar nuevo diente con valores por defecto
      setTeeth([...teeth, {
        toothNumber,
        condition: 'HEALTHY',
        surfaces: [],
        notes: '',
      }]);
    }
  };

  const updateToothData = (toothNumber: number, field: keyof ToothData, value: any) => {
    setTeeth(teeth.map(tooth => 
      tooth.toothNumber === toothNumber 
        ? { ...tooth, [field]: value }
        : tooth
    ));
  };

  const removeTooth = (toothNumber: number) => {
    setTeeth(teeth.filter(t => t.toothNumber !== toothNumber));
    if (selectedTooth === toothNumber) {
      setSelectedTooth(null);
    }
  };

  const toggleSurface = (toothNumber: number, surface: string) => {
    const tooth = teeth.find(t => t.toothNumber === toothNumber);
    if (!tooth) return;

    const surfaces = tooth.surfaces.includes(surface)
      ? tooth.surfaces.filter(s => s !== surface)
      : [...tooth.surfaces, surface];

    updateToothData(toothNumber, 'surfaces', surfaces);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      alert('Por favor seleccione un paciente');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/odontograms',
        {
          patientId: selectedPatient,
          notes,
          teeth: teeth.map(t => ({
            toothNumber: t.toothNumber,
            condition: t.condition,
            surfaces: t.surfaces,
            notes: t.notes,
            color: t.color,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate('/odontograms');
    } catch (error: any) {
      console.error('Error creating odontogram:', error);
      alert(error.response?.data?.message || 'Error al crear odontograma');
    } finally {
      setSaving(false);
    }
  };

  const selectedToothData = selectedTooth ? teeth.find(t => t.toothNumber === selectedTooth) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/odontograms')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Odontograma</h1>
          <p className="text-gray-600">Crear registro dental del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente *
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar paciente...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - CI: {patient.documentId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Generales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observaciones generales del examen..."
              />
            </div>
          </div>
        </div>

        {/* Odontogram Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Odontograma Interactivo
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Haz clic en un diente para agregar o editar su información
          </p>
          <OdontogramChart
            teeth={teeth}
            onToothClick={handleToothClick}
            editable={true}
          />
        </div>

        {/* Tooth Editor */}
        {selectedToothData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Editar Diente #{selectedToothData.toothNumber}
              </h2>
              <button
                type="button"
                onClick={() => removeTooth(selectedToothData.toothNumber)}
                className="text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condición
                </label>
                <select
                  value={selectedToothData.condition}
                  onChange={(e) => updateToothData(selectedToothData.toothNumber, 'condition', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TOOTH_CONDITIONS.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superficies Afectadas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TOOTH_SURFACES.map((surface) => (
                    <label
                      key={surface.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedToothData.surfaces.includes(surface.value)}
                        onChange={() => toggleSurface(selectedToothData.toothNumber, surface.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{surface.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del Diente
                </label>
                <textarea
                  value={selectedToothData.notes}
                  onChange={(e) => updateToothData(selectedToothData.toothNumber, 'notes', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observaciones específicas de este diente..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Teeth Summary */}
        {teeth.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen de Dientes Registrados ({teeth.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {teeth.map((tooth) => (
                <button
                  key={tooth.toothNumber}
                  type="button"
                  onClick={() => setSelectedTooth(tooth.toothNumber)}
                  className={`p-2 rounded border text-sm ${
                    selectedTooth === tooth.toothNumber
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold">#{tooth.toothNumber}</div>
                  <div className="text-xs text-gray-600 truncate">
                    {TOOTH_CONDITIONS.find(c => c.value === tooth.condition)?.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/odontograms')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !selectedPatient}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Guardando...' : 'Guardar Odontograma'}
          </button>
        </div>
      </form>
    </div>
  );
}
