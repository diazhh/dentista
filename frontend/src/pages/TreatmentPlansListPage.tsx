import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Eye, Filter } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  status: string;
  totalCost: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    documentId: string;
  };
  items?: Array<{
    id: string;
    status: string;
  }>;
}

export default function TreatmentPlansListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/treatment-plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PROPOSED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      PROPOSED: 'Propuesto',
      ACCEPTED: 'Aceptado',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getProgressPercentage = (plan: TreatmentPlan) => {
    if (!plan.items || plan.items.length === 0) return 0;
    const completed = plan.items.filter((item) => item.status === 'COMPLETED').length;
    return Math.round((completed / plan.items.length) * 100);
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      searchTerm === '' ||
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.patient?.documentId.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Planes de Tratamiento</h1>
          </div>
          <button
            onClick={() => navigate('/treatment-plans/new')}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nuevo Plan
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar por título o paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="DRAFT">Borrador</option>
                <option value="PROPOSED">Propuesto</option>
                <option value="ACCEPTED">Aceptado</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/treatment-plans/${plan.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{plan.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {plan.patient?.firstName} {plan.patient?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">Cédula: {plan.patient?.documentId}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(plan.status)}
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Costo Total:</span>
                      <span className="font-semibold text-gray-900">
                        ${plan.totalCost.toLocaleString()}
                      </span>
                    </div>

                    {plan.items && plan.items.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-500">Progreso:</span>
                          <span className="font-medium text-gray-900">
                            {getProgressPercentage(plan)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all"
                            style={{ width: `${getProgressPercentage(plan)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {plan.startDate && (
                      <div className="text-xs sm:text-sm text-gray-500">
                        Inicio: {format(new Date(plan.startDate), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    )}

                    <div className="pt-2 sm:pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Creado: {format(new Date(plan.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/treatment-plans/${plan.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPlans.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No se encontraron planes de tratamiento</p>
              </div>
            )}

            <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Mostrando {filteredPlans.length} de {plans.length} planes
            </div>
          </>
        )}
      </div>
    </div>
  );
}
