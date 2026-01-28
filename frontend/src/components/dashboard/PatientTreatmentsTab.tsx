import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface TreatmentPlanItem {
  id: string;
  description: string;
  toothNumber?: number;
  status: string;
  estimatedCost: number;
  actualCost?: number;
  completedAt?: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  status: string;
  totalCost: number;
  startDate: string;
  endDate?: string;
  items: TreatmentPlanItem[];
  completedItems: number;
  totalItems: number;
}

interface Props {
  patientId: string;
}

export default function PatientTreatmentsTab({ patientId }: Props) {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreatmentPlans();
  }, [patientId]);

  const fetchTreatmentPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/treatment-plans?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const plansWithProgress = data.map((plan: any) => {
          const completedItems = plan.items?.filter((item: any) => item.status === 'COMPLETED').length || 0;
          const totalItems = plan.items?.length || 0;
          return {
            ...plan,
            completedItems,
            totalItems,
          };
        });
        setTreatmentPlans(plansWithProgress);
      }
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROPOSED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PROPOSED: 'Propuesto',
      ACCEPTED: 'Aceptado',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateProgress = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planes de Tratamiento</h2>
        <Button>Nuevo Plan</Button>
      </div>

      {treatmentPlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay planes de tratamiento registrados
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {treatmentPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <Badge className={getStatusColor(plan.status)}>
                        {getStatusLabel(plan.status)}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Inicio</p>
                      <p className="font-medium">{formatDate(plan.startDate)}</p>
                    </div>
                  </div>
                  {plan.endDate && (
                    <div className="flex items-center text-sm">
                      <CheckCircle className="mr-2 h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500">Fin</p>
                        <p className="font-medium">{formatDate(plan.endDate)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Costo Total</p>
                      <p className="font-medium">${plan.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Progreso</p>
                      <p className="font-medium">
                        {plan.completedItems}/{plan.totalItems} items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {plan.totalItems > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso del tratamiento</span>
                      <span className="font-medium">
                        {calculateProgress(plan.completedItems, plan.totalItems)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${calculateProgress(plan.completedItems, plan.totalItems)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardHeader>

              {plan.items && plan.items.length > 0 && (
                <CardContent>
                  <h4 className="font-semibold mb-2">Procedimientos:</h4>
                  <div className="space-y-2">
                    {plan.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          {item.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {item.description}
                            {item.toothNumber && ` (Diente ${item.toothNumber})`}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          ${item.actualCost || item.estimatedCost}
                        </span>
                      </div>
                    ))}
                    {plan.items.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{plan.items.length - 3} procedimientos más
                      </p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Ver Detalles Completos
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
