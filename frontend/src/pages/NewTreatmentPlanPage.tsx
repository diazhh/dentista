import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Save, X, Plus, Trash2, User } from 'lucide-react';
import axios from 'axios';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
}

interface TreatmentItem {
  tooth?: string;
  surface?: string;
  procedureCode: string;
  procedureName: string;
  description?: string;
  estimatedCost: number;
  priority: number;
  estimatedDuration?: number;
  notes?: string;
}

export default function NewTreatmentPlanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    patientId: '',
    title: '',
    description: '',
    diagnosis: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const [items, setItems] = useState<TreatmentItem[]>([
    {
      tooth: '',
      surface: '',
      procedureCode: '',
      procedureName: '',
      description: '',
      estimatedCost: 0,
      priority: 1,
      estimatedDuration: 0,
      notes: '',
    },
  ]);

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

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tooth: '',
        surface: '',
        procedureCode: '',
        procedureName: '',
        description: '',
        estimatedCost: 0,
        priority: 1,
        estimatedDuration: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof TreatmentItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const cleanedItems = items.map(item => ({
        ...item,
        tooth: item.tooth || undefined,
        surface: item.surface || undefined,
        description: item.description || undefined,
        estimatedDuration: item.estimatedDuration || undefined,
        notes: item.notes || undefined,
      }));

      await axios.post(
        'http://localhost:3000/api/treatment-plans',
        {
          ...formData,
          description: formData.description || undefined,
          diagnosis: formData.diagnosis || undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          notes: formData.notes || undefined,
          items: cleanedItems,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate('/treatment-plans');
    } catch (error: any) {
      console.error('Error creating treatment plan:', error);
      alert(error.response?.data?.message || 'Error al crear plan de tratamiento');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      searchTerm === '' ||
      p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.documentId.includes(searchTerm)
  );

  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Nuevo Plan de Tratamiento</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Información General</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  Paciente *
                </label>
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar paciente</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.documentId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Plan de Ortodoncia Completo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción general del plan de tratamiento"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Diagnóstico</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Diagnóstico del paciente"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PROPOSED">Propuesto</option>
                  <option value="ACCEPTED">Aceptado</option>
                </select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Fecha Fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Procedimientos</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Agregar Procedimiento
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Procedimiento {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Diente</label>
                      <input
                        type="text"
                        value={item.tooth}
                        onChange={(e) => handleItemChange(index, 'tooth', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: 11, 21"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Superficie</label>
                      <input
                        type="text"
                        value={item.surface}
                        onChange={(e) => handleItemChange(index, 'surface', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Oclusal"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Código *</label>
                      <input
                        type="text"
                        required
                        value={item.procedureCode}
                        onChange={(e) => handleItemChange(index, 'procedureCode', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: D0120"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 mb-1 block">Nombre del Procedimiento *</label>
                      <input
                        type="text"
                        required
                        value={item.procedureName}
                        onChange={(e) => handleItemChange(index, 'procedureName', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Limpieza Dental"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Costo *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.estimatedCost}
                        onChange={(e) => handleItemChange(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Prioridad *</label>
                      <select
                        value={item.priority}
                        onChange={(e) => handleItemChange(index, 'priority', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 - Muy Alta</option>
                        <option value={2}>2 - Alta</option>
                        <option value={3}>3 - Media</option>
                        <option value={4}>4 - Baja</option>
                        <option value={5}>5 - Muy Baja</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Duración (min)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.estimatedDuration}
                        onChange={(e) => handleItemChange(index, 'estimatedDuration', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="30"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-xs text-gray-600 mb-1 block">Descripción</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción del procedimiento"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-sm sm:text-lg font-semibold text-gray-900">Costo Total Estimado:</span>
                <span className="text-xl sm:text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'Guardando...' : 'Guardar Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
