import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Trash2, CheckCircle, User, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: string;
  totalCost: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    documentId: string;
    phone: string;
  };
  items: Array<{
    id: string;
    tooth?: string;
    surface?: string;
    procedureCode: string;
    procedureName: string;
    description?: string;
    estimatedCost: number;
    priority: number;
    estimatedDuration?: number;
    status: string;
    notes?: string;
  }>;
}

export default function TreatmentPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlan();
    }
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/treatment-plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlan(response.data);
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/treatment-plans/items/${itemId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchPlan();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Error al actualizar el estado del procedimiento');
    }
  };

  const handleUpdatePlanStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/treatment-plans/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchPlan();
    } catch (error) {
      console.error('Error updating plan status:', error);
      alert('Error al actualizar el estado del plan');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este plan de tratamiento?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/treatment-plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/treatment-plans');
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Error al eliminar el plan');
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
      PENDING: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      PROPOSED: 'Propuesto',
      ACCEPTED: 'Aceptado',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
      PENDING: 'Pendiente',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const styles: Record<number, string> = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<number, string> = {
      1: 'Muy Alta',
      2: 'Alta',
      3: 'Media',
      4: 'Baja',
      5: 'Muy Baja',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const getProgressPercentage = () => {
    if (!plan || plan.items.length === 0) return 0;
    const completed = plan.items.filter((item) => item.status === 'COMPLETED').length;
    return Math.round((completed / plan.items.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Plan de tratamiento no encontrado</p>
          <button
            onClick={() => navigate('/treatment-plans')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{plan.title}</h1>
                <p className="text-sm sm:text-base text-gray-500 break-words">
                  {plan.patient?.firstName} {plan.patient?.lastName} - {plan.patient?.documentId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Eliminar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Paciente</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {plan.patient?.firstName} {plan.patient?.lastName}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Cédula: {plan.patient?.documentId}</p>
            <p className="text-xs sm:text-sm text-gray-500">Tel: {plan.patient?.phone}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Costo Total</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">${plan.totalCost.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{plan.items.length} procedimientos</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Fechas</h3>
            </div>
            {plan.startDate && (
              <p className="text-xs sm:text-sm text-gray-600">
                Inicio: {format(new Date(plan.startDate), 'dd/MM/yyyy', { locale: es })}
              </p>
            )}
            {plan.endDate && (
              <p className="text-xs sm:text-sm text-gray-600">
                Fin: {format(new Date(plan.endDate), 'dd/MM/yyyy', { locale: es })}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Creado: {format(new Date(plan.createdAt), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Estado del Plan</h3>
            {getStatusBadge(plan.status)}
          </div>

          {plan.description && (
            <div className="mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción:</p>
              <p className="text-sm sm:text-base text-gray-600">{plan.description}</p>
            </div>
          )}

          {plan.diagnosis && (
            <div className="mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
              <p className="text-sm sm:text-base text-gray-600">{plan.diagnosis}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
              <span className="font-medium text-gray-700">Progreso General:</span>
              <span className="font-semibold text-gray-900">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleUpdatePlanStatus('PROPOSED')}
              disabled={plan.status === 'PROPOSED'}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proponer
            </button>
            <button
              onClick={() => handleUpdatePlanStatus('ACCEPTED')}
              disabled={plan.status === 'ACCEPTED'}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-green-300 text-green-700 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aceptar
            </button>
            <button
              onClick={() => handleUpdatePlanStatus('IN_PROGRESS')}
              disabled={plan.status === 'IN_PROGRESS'}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              En Progreso
            </button>
            <button
              onClick={() => handleUpdatePlanStatus('COMPLETED')}
              disabled={plan.status === 'COMPLETED'}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-purple-300 text-purple-700 rounded hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Completar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Procedimientos</h3>

          <div className="space-y-4">
            {plan.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-500">#{index + 1}</span>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">{item.procedureName}</h4>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Código: {item.procedureCode}</p>
                    {item.tooth && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Diente: {item.tooth} {item.surface && `- Superficie: ${item.surface}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    {getStatusBadge(item.status)}
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        ${item.estimatedCost.toLocaleString()}
                      </p>
                      {item.estimatedDuration && (
                        <p className="text-xs text-gray-500">{item.estimatedDuration} min</p>
                      )}
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">{item.description}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleUpdateItemStatus(item.id, 'PENDING')}
                    disabled={item.status === 'PENDING'}
                    className="px-2 sm:px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pendiente
                  </button>
                  <button
                    onClick={() => handleUpdateItemStatus(item.id, 'IN_PROGRESS')}
                    disabled={item.status === 'IN_PROGRESS'}
                    className="px-2 sm:px-3 py-1 text-xs border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    En Progreso
                  </button>
                  <button
                    onClick={() => handleUpdateItemStatus(item.id, 'COMPLETED')}
                    disabled={item.status === 'COMPLETED'}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Completado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {plan.notes && (
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Notas</h3>
            <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap">{plan.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
