import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, CreditCard, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  invoice: {
    id: string;
    invoiceNumber: string;
  };
}

interface PaymentStats {
  totalPaid: number;
  averagePayment: number;
  mostUsedMethod: string;
  paymentCount: number;
}

interface Props {
  patientId: string;
}

const PAGE_SIZE = 10;

export default function PatientPaymentsTab({ patientId }: Props) {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, [patientId]);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/invoices', {
        params: { patientId },
      });
      const invoices = response.data;
      const dataList = Array.isArray(invoices) ? invoices : invoices.data || [];

      const payments: Payment[] = [];
      for (const invoice of dataList) {
        if (invoice.payments && invoice.payments.length > 0) {
          invoice.payments.forEach((payment: any) => {
            payments.push({
              ...payment,
              invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
              },
            });
          });
        }
      }

      payments.sort((a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );

      setAllPayments(payments);

      if (payments.length > 0) {
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const averagePayment = totalPaid / payments.length;
        const methodCounts: Record<string, number> = {};
        payments.forEach(p => {
          methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
        });
        const mostUsedMethod = Object.keys(methodCounts).reduce((a, b) =>
          methodCounts[a] > methodCounts[b] ? a : b
        );
        setStats({ totalPaid, averagePayment, mostUsedMethod, paymentCount: payments.length });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(allPayments.length / PAGE_SIZE);
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allPayments.slice(start, start + PAGE_SIZE);
  }, [allPayments, page]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-green-100 text-green-800';
      case 'CREDIT_CARD':
        return 'bg-blue-100 text-blue-800';
      case 'DEBIT_CARD':
        return 'bg-purple-100 text-purple-800';
      case 'TRANSFER':
        return 'bg-orange-100 text-orange-800';
      case 'CHECK':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h2 className="text-2xl font-bold">Historial de Pagos</h2>
        <div className="flex items-center gap-2">
          {allPayments.length > 0 && (
            <span className="text-sm text-muted-foreground">{allPayments.length} pagos</span>
          )}
          <Button>Registrar Pago</Button>
        </div>
      </div>

      {/* Payment Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalPaid.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Pago</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.averagePayment.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Método Más Usado</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{getMethodLabel(stats.mostUsedMethod)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pagos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paymentCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments List */}
      {allPayments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay pagos registrados
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedPayments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Pago de ${payment.amount.toFixed(2)}
                        </CardTitle>
                        <Badge className={getMethodColor(payment.paymentMethod)}>
                          {getMethodLabel(payment.paymentMethod)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(payment.paymentDate)}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="mr-1 h-4 w-4" />
                          Factura #{payment.invoice.invoiceNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {payment.notes && (
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Notas:</span> {payment.notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
