import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  items: any[];
}

interface InvoiceSummary {
  totalInvoiced: number;
  totalPaid: number;
  pendingBalance: number;
  overdueInvoices: number;
}

interface Props {
  patientId: string;
}

export default function PatientInvoicesTab({ patientId }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [patientId]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/invoices?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
        
        // Calculate summary
        const totalInvoiced = data.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
        const totalPaid = data.reduce((sum: number, inv: Invoice) => sum + (inv.total - inv.balance), 0);
        const pendingBalance = data.reduce((sum: number, inv: Invoice) => sum + inv.balance, 0);
        const overdueInvoices = data.filter((inv: Invoice) => 
          inv.status === 'OVERDUE' || (inv.status === 'SENT' && new Date(inv.dueDate) < new Date())
        ).length;
        
        setSummary({
          totalInvoiced,
          totalPaid,
          pendingBalance,
          overdueInvoices,
        });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada',
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

  const isOverdue = (invoice: Invoice) => {
    return invoice.status === 'SENT' && new Date(invoice.dueDate) < new Date();
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
        <h2 className="text-2xl font-bold">Facturas</h2>
        <Button>Nueva Factura</Button>
      </div>

      {/* Financial Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalInvoiced.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalPaid.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Pendiente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${summary.pendingBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.overdueInvoices}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No hay facturas registradas
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className={isOverdue(invoice) ? 'border-red-300' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Factura #{invoice.invoiceNumber}
                      </CardTitle>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                      {isOverdue(invoice) && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Vencida
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Emitida: {formatDate(invoice.issueDate)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Vence: {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
                    {invoice.balance > 0 && (
                      <p className="text-sm text-orange-600">
                        Pendiente: ${invoice.balance.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Subtotal</p>
                    <p className="font-medium">${invoice.subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Impuestos</p>
                    <p className="font-medium">${invoice.tax.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Items</p>
                    <p className="font-medium">{invoice.items?.length || 0} procedimientos</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    Ver Detalles
                  </Button>
                  {invoice.balance > 0 && (
                    <Button className="flex-1">Registrar Pago</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
