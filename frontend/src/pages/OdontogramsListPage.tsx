import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smile, Search, Plus, Eye, Calendar } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Odontogram {
  id: string;
  date: string;
  notes?: string;
  teeth: any[];
  patient: {
    firstName: string;
    lastName: string;
    documentId: string;
  };
}

export default function OdontogramsListPage() {
  const navigate = useNavigate();
  const [odontograms, setOdontograms] = useState<Odontogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOdontograms();
  }, []);

  const fetchOdontograms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/odontograms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOdontograms(response.data);
    } catch (error) {
      console.error('Error fetching odontograms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOdontograms = odontograms.filter(odontogram => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${odontogram.patient.firstName} ${odontogram.patient.lastName}`.toLowerCase();
    const patientDoc = odontogram.patient.documentId.toLowerCase();
    
    return patientName.includes(searchLower) || patientDoc.includes(searchLower);
  });

  const getTeethSummary = (teeth: any[]) => {
    const conditions = teeth.reduce((acc: any, tooth) => {
      acc[tooth.condition] = (acc[tooth.condition] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(conditions)
      .map(([condition, count]) => `${count} ${condition}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando odontogramas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Odontogramas</h1>
          <p className="text-gray-600">Gestión de registros dentales de pacientes</p>
        </div>
        <button
          onClick={() => navigate('/odontograms/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Odontograma
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por paciente o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Odontogramas</p>
              <p className="text-2xl font-bold text-gray-900">{odontograms.length}</p>
            </div>
            <Smile className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pacientes con Registro</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(odontograms.map(o => o.patient.documentId)).size}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Registros este Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                {odontograms.filter(o => {
                  const date = new Date(o.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Odontograms List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredOdontograms.length === 0 ? (
          <div className="text-center py-12">
            <Smile className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay odontogramas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Comienza creando un nuevo odontograma.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/odontograms/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nuevo Odontograma
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dientes Registrados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resumen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOdontograms.map((odontogram) => (
                <tr key={odontogram.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {odontogram.patient.firstName} {odontogram.patient.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        CI: {odontogram.patient.documentId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(odontogram.date), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(odontogram.date), 'HH:mm', { locale: es })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {odontogram.teeth.length} dientes
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {getTeethSummary(odontogram.teeth)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {odontogram.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/odontograms/${odontogram.id}`)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
