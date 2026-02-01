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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Odontogramas</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestión de registros dentales de pacientes</p>
        </div>
        <button
          onClick={() => navigate('/odontograms/new')}
          className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          Nuevo Odontograma
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Buscar por paciente o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Odontogramas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{odontograms.length}</p>
            </div>
            <Smile className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Pacientes con Registro</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {new Set(odontograms.map(o => o.patient.documentId)).size}
              </p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Registros este Mes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {odontograms.filter(o => {
                  const date = new Date(o.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Odontograms List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredOdontograms.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <Smile className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay odontogramas</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Comienza creando un nuevo odontograma.'}
            </p>
            {!searchTerm && (
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => navigate('/odontograms/new')}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Nuevo Odontograma
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Vista de tabla para pantallas medianas y grandes */}
            <div className="hidden md:block">
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
            </div>

            {/* Vista de cards para pantallas pequeñas */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredOdontograms.map((odontogram) => (
                <div key={odontogram.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {odontogram.patient.firstName} {odontogram.patient.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        CI: {odontogram.patient.documentId}
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {odontogram.teeth.length} dientes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <span className="ml-1 text-gray-900">
                        {format(new Date(odontogram.date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Hora:</span>
                      <span className="ml-1 text-gray-900">
                        {format(new Date(odontogram.date), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                  </div>

                  {odontogram.notes && (
                    <div className="text-xs text-gray-500 mb-3 truncate">
                      <span className="font-medium">Notas:</span> {odontogram.notes}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => navigate(`/odontograms/${odontogram.id}`)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
