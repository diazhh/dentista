import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, Trash2, Filter, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import OdontogramChart from '../components/OdontogramChart';
import OdontogramSVG, { ToothEditor } from '../components/OdontogramSVG';

interface Odontogram {
  id: string;
  date: string;
  notes?: string;
  teeth: Array<{
    id: string;
    toothNumber: number;
    condition: string;
    surfaces: string[];
    notes?: string;
    color?: string;
  }>;
  patient: {
    firstName: string;
    lastName: string;
    documentId: string;
    dateOfBirth: string;
  };
}

const TOOTH_CONDITIONS: Record<string, string> = {
  HEALTHY: 'Sano',
  CAVITY: 'Caries',
  FILLED: 'Obturado',
  CROWN: 'Corona',
  BRIDGE: 'Puente',
  IMPLANT: 'Implante',
  MISSING: 'Ausente',
  EXTRACTION_NEEDED: 'Extracción Necesaria',
  ROOT_CANAL: 'Endodoncia',
  FRACTURED: 'Fracturado',
  WORN: 'Desgastado',
  ABSCESS: 'Absceso',
};

const TOOTH_SURFACES: Record<string, string> = {
  OCCLUSAL: 'Oclusal (O)',
  MESIAL: 'Mesial (M)',
  DISTAL: 'Distal (D)',
  BUCCAL: 'Bucal (B)',
  LINGUAL: 'Lingual (L)',
  INCISAL: 'Incisal (I)',
};

export default function OdontogramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [odontogram, setOdontogram] = useState<Odontogram | null>(null);
  const [loading, setLoading] = useState(true);
  const [useSVGView, setUseSVGView] = useState(true); // Usar vista SVG por defecto
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [showTeethList, setShowTeethList] = useState(true);
  const [editingTooth, setEditingTooth] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchOdontogram();
    }
  }, [id]);

  const fetchOdontogram = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/odontograms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOdontogram(response.data);
    } catch (error) {
      console.error('Error fetching odontogram:', error);
      alert('Error al cargar el odontograma');
      navigate('/odontograms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este odontograma?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/odontograms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/odontograms');
    } catch (error) {
      console.error('Error deleting odontogram:', error);
      alert('Error al eliminar el odontograma');
    }
  };

  const handleToothClick = (toothNumber: number) => {
    setEditingTooth(toothNumber);
  };

  const handleToothSave = async (data: { condition: string; surfaces: string[]; notes: string }) => {
    if (!editingTooth || !odontogram) return;

    try {
      const token = localStorage.getItem('token');
      const existingTooth = odontogram.teeth.find(t => t.toothNumber === editingTooth);

      if (existingTooth) {
        // Actualizar diente existente
        await axios.patch(
          `http://localhost:3000/api/odontograms/${id}/teeth/${existingTooth.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Crear nuevo diente
        await axios.post(
          `http://localhost:3000/api/odontograms/${id}/teeth`,
          { toothNumber: editingTooth, ...data },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchOdontogram();
      setEditingTooth(null);
    } catch (error) {
      console.error('Error saving tooth:', error);
      alert('Error al guardar el diente');
    }
  };

  const filteredTeeth = odontogram?.teeth.filter(t =>
    filterCondition ? t.condition === filterCondition : true
  ) || [];

  const uniqueConditions = [...new Set(odontogram?.teeth.map(t => t.condition) || [])];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando odontograma...</div>
      </div>
    );
  }

  if (!odontogram) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Odontograma no encontrado</p>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/odontograms')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Odontograma</h1>
            <p className="text-gray-600">
              {odontogram.patient.firstName} {odontogram.patient.lastName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Toggle Vista */}
          <button
            onClick={() => setUseSVGView(!useSVGView)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              useSVGView
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {useSVGView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {useSVGView ? 'Vista SVG' : 'Vista Clásica'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Paciente</h3>
          </div>
          <p className="text-gray-900 font-medium">
            {odontogram.patient.firstName} {odontogram.patient.lastName}
          </p>
          <p className="text-sm text-gray-600">CI: {odontogram.patient.documentId}</p>
          <p className="text-sm text-gray-600">
            Edad: {calculateAge(odontogram.patient.dateOfBirth)} años
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">Fecha de Registro</h3>
          </div>
          <p className="text-gray-900 font-medium">
            {format(new Date(odontogram.date), 'dd MMMM yyyy', { locale: es })}
          </p>
          <p className="text-sm text-gray-600">
            {format(new Date(odontogram.date), 'HH:mm', { locale: es })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Estadísticas</h3>
          </div>
          <p className="text-gray-900 font-medium">
            {odontogram.teeth.length} dientes registrados
          </p>
          <p className="text-sm text-gray-600">
            {odontogram.teeth.filter(t => t.condition !== 'HEALTHY').length} con condiciones
          </p>
        </div>
      </div>

      {/* Notes */}
      {odontogram.notes && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Notas Generales</h3>
          <p className="text-gray-700">{odontogram.notes}</p>
        </div>
      )}

      {/* Odontogram Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Odontograma</h3>
          {!useSVGView && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las condiciones</option>
                {uniqueConditions.map(condition => (
                  <option key={condition} value={condition}>
                    {TOOTH_CONDITIONS[condition] || condition}
                  </option>
                ))}
              </select>
              {filterCondition && (
                <button
                  onClick={() => setFilterCondition('')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          )}
        </div>

        {useSVGView ? (
          <OdontogramSVG
            teeth={odontogram.teeth}
            editable={false}
            showLegend={true}
            highlightConditions={filterCondition ? [filterCondition] : []}
            onToothClick={handleToothClick}
          />
        ) : (
          <OdontogramChart
            teeth={filterCondition ? filteredTeeth : odontogram.teeth}
            editable={false}
          />
        )}
      </div>

      {/* Modal de edición de diente */}
      {editingTooth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ToothEditor
            toothNumber={editingTooth}
            currentCondition={
              odontogram.teeth.find(t => t.toothNumber === editingTooth)?.condition || 'HEALTHY'
            }
            currentSurfaces={
              odontogram.teeth.find(t => t.toothNumber === editingTooth)?.surfaces || []
            }
            currentNotes={
              odontogram.teeth.find(t => t.toothNumber === editingTooth)?.notes || ''
            }
            onSave={handleToothSave}
            onCancel={() => setEditingTooth(null)}
          />
        </div>
      )}

      {/* Teeth Details */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Detalle de Dientes ({filteredTeeth.length}
            {filterCondition && ` de ${odontogram.teeth.length}`})
          </h3>
          <button
            onClick={() => setShowTeethList(!showTeethList)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showTeethList ? 'Ocultar lista' : 'Mostrar lista'}
          </button>
        </div>
        {showTeethList && (
        <div className="space-y-4">
          {filteredTeeth.map((tooth) => (
            <div
              key={tooth.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-900">
                      Diente #{tooth.toothNumber}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {TOOTH_CONDITIONS[tooth.condition] || tooth.condition}
                    </span>
                  </div>

                  {tooth.surfaces.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Superficies afectadas:{' '}
                      </span>
                      <span className="text-sm text-gray-600">
                        {tooth.surfaces.map(s => TOOTH_SURFACES[s] || s).join(', ')}
                      </span>
                    </div>
                  )}

                  {tooth.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notas: </span>
                      <span className="text-sm text-gray-600">{tooth.notes}</span>
                    </div>
                  )}
                </div>

                {tooth.color && (
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: tooth.color }}
                    title="Color personalizado"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        {!showTeethList && filteredTeeth.length > 0 && (
          <p className="text-sm text-gray-500 italic">
            Haga clic en "Mostrar lista" para ver los detalles de los dientes.
          </p>
        )}
      </div>
    </div>
  );
}
