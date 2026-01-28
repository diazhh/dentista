import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, CreditCard, Calendar, TrendingUp } from 'lucide-react';

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

export default function PatientPaymentsTab({ patientId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [patientId]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch invoices with payments
      const invoicesResponse = await fetch(
        `http://localhost:3000/api/invoices?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (invoicesResponse.ok) {
        const invoices = await invoicesResponse.json();
        
        // Extract all payments from invoices
        const allPayments: Payment[] = [];
        for (const invoice of invoices) {
          if (invoice.payments && invoice.payments.length > 0) {
            invoice.payments.forEach((payment: any) => {
              allPayments.push({
                ...payment,
                invoice: {
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                },
              });
            });
          }
        }
        
        // Sort by date descending
        allPayments.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        );
        
        setPayments(allPayments);
        
        // Calculate stats
        if (allPayments.length > 0) {
          const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
          const averagePayment = totalPaid / allPayments.length;
          
          // Find most used payment method
          const methodCounts: Record<string, number> = {};
          allPayments.forEach(p => {
            methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
          });
          const mostUsedMethod = Object.keys(methodCounts).reduce((a, b) => 
            methodCounts[a] > methodCounts[b] ? a : b
          );
          
          setStats({
            totalPaid,
            averagePayment,
            mostUsedMethod,
            paymentCount: allPayments.length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <Button>Registrar Pago</Button>
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
      {payments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay pagos registrados
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
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
      )}
    </div>
  );
}
