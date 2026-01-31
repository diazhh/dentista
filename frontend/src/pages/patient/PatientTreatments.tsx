import { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';

interface TreatmentItem {
  id: string;
  tooth?: string;
  surface?: string;
  procedureCode: string;
  procedureName: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  estimatedCost: number;
  actualCost?: number;
  priority: number;
  notes?: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalCost: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  items: TreatmentItem[];
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PROPOSED: { label: 'Propuesto', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  ACCEPTED: { label: 'Aceptado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-100 text-purple-700', icon: Clock },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const itemStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-blue-100 text-blue-600' },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-600' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
};

export default function PatientTreatments() {
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/portal/treatment-plans');
      setTreatments(response.data);
    } catch (err) {
      console.error('Error fetching treatments:', err);
      setError('Error al cargar los planes de tratamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (planId: string) => {
    try {
      setActionLoading(planId);
      await api.post(`/portal/treatment-plans/${planId}/accept`);
      await fetchTreatments();
    } catch (err) {
      console.error('Error accepting plan:', err);
      setError('Error al aceptar el plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (planId: string) => {
    try {
      setActionLoading(planId);
      await api.post(`/portal/treatment-plans/${planId}/reject`, { reason: rejectReason });
      setShowRejectModal(null);
      setRejectReason('');
      await fetchTreatments();
    } catch (err) {
      console.error('Error rejecting plan:', err);
      setError('Error al rechazar el plan');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProgress = (items: TreatmentItem[]) => {
    const completed = items.filter(i => i.status === 'COMPLETED').length;
    return Math.round((completed / items.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const proposedPlans = treatments.filter(t => t.status === 'PROPOSED');
  const activePlans = treatments.filter(t => ['ACCEPTED', 'IN_PROGRESS'].includes(t.status));
  const otherPlans = treatments.filter(t => ['COMPLETED', 'CANCELLED', 'DRAFT'].includes(t.status));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Tratamientos</h1>
        <p className="text-gray-600 mt-1">Revisa y gestiona tus planes de tratamiento dental</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes de aprobar</p>
              <p className="text-xl font-bold text-gray-900">{proposedPlans.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En progreso</p>
              <p className="text-xl font-bold text-gray-900">{activePlans.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-xl font-bold text-gray-900">
                {treatments.filter(t => t.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Costo total activo</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(activePlans.reduce((sum, p) => sum + p.totalCost, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Plans - Need Action */}
      {proposedPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Planes pendientes de aprobación
          </h2>
          <div className="space-y-4">
            {proposedPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-yellow-50 border-2 border-yellow-200 rounded-xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                      {plan.diagnosis && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Diagnóstico:</span> {plan.diagnosis}
                        </p>
                      )}
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(plan.totalCost)}</p>
                      <p className="text-sm text-gray-500">{plan.items.length} procedimientos</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="mt-4 bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Procedimientos incluidos:</h4>
                    <div className="space-y-2">
                      {plan.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{item.procedureName}</span>
                            {item.tooth && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                Diente {item.tooth}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-600">{formatCurrency(item.estimatedCost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleAccept(plan.id)}
                      disabled={actionLoading === plan.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Aceptar Plan
                    </button>
                    <button
                      onClick={() => setShowRejectModal(plan.id)}
                      disabled={actionLoading === plan.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Plans */}
      {activePlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Tratamientos activos
          </h2>
          <div className="space-y-4">
            {activePlans.map((plan) => {
              const isExpanded = expandedPlan === plan.id;
              const progress = getProgress(plan.items);
              const status = statusConfig[plan.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progreso</span>
                            <span className="text-gray-900 font-medium">{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>{plan.items.filter(i => i.status === 'COMPLETED').length} de {plan.items.length} completados</span>
                          {plan.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Inicio: {formatDate(plan.startDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.totalCost)}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                      {plan.diagnosis && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700">Diagnóstico</h4>
                          <p className="text-gray-600">{plan.diagnosis}</p>
                        </div>
                      )}

                      <h4 className="font-medium text-gray-700 mb-3">Procedimientos</h4>
                      <div className="space-y-3">
                        {plan.items.map((item) => {
                          const itemStatus = itemStatusConfig[item.status];
                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{item.procedureName}</span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${itemStatus.color}`}>
                                      {itemStatus.label}
                                    </span>
                                  </div>
                                  {item.tooth && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Diente: {item.tooth} {item.surface && `(${item.surface})`}
                                    </p>
                                  )}
                                  {item.description && (
                                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">
                                    {formatCurrency(item.actualCost || item.estimatedCost)}
                                  </p>
                                  {item.actualCost && item.actualCost !== item.estimatedCost && (
                                    <p className="text-xs text-gray-500 line-through">
                                      {formatCurrency(item.estimatedCost)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {plan.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Notas:</span> {plan.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Plans */}
      {otherPlans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de tratamientos</h2>
          <div className="space-y-3">
            {otherPlans.map((plan) => {
              const status = statusConfig[plan.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{plan.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(plan.totalCost)}</p>
                      <p className="text-sm text-gray-500">{formatDate(plan.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {treatments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tienes planes de tratamiento</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rechazar plan de tratamiento</h2>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas rechazar este plan? Puedes indicar una razón opcional.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Razón del rechazo (opcional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Rechazar plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
