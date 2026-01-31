import { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Download,
} from 'lucide-react';
import api from '../../services/api';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'INSURANCE' | 'OTHER';
  paymentDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  reference?: string;
  notes?: string;
  invoice: {
    invoiceNumber: string;
    total: number;
  };
}

interface PaymentsSummary {
  totalPaid: number;
  paidThisMonth: number;
  paidThisYear: number;
  pendingBalance: number;
}

const paymentMethodConfig = {
  CASH: { label: 'Efectivo', icon: Banknote, color: 'text-green-600' },
  CREDIT_CARD: { label: 'Tarjeta de Crédito', icon: CreditCard, color: 'text-blue-600' },
  DEBIT_CARD: { label: 'Tarjeta de Débito', icon: CreditCard, color: 'text-purple-600' },
  BANK_TRANSFER: { label: 'Transferencia', icon: Building2, color: 'text-indigo-600' },
  CHECK: { label: 'Cheque', icon: Receipt, color: 'text-gray-600' },
  INSURANCE: { label: 'Seguro', icon: Building2, color: 'text-teal-600' },
  OTHER: { label: 'Otro', icon: DollarSign, color: 'text-gray-600' },
};

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  FAILED: { label: 'Fallido', color: 'bg-red-100 text-red-700', icon: XCircle },
  REFUNDED: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
};

export default function PatientPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get('/portal/payments'),
        api.get('/portal/payments/summary'),
      ]);
      setPayments(paymentsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Error al cargar el historial de pagos');
    } finally {
      setLoading(false);
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

  const groupPaymentsByMonth = (payments: Payment[]) => {
    const groups: { [key: string]: Payment[] } = {};
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(payment);
    });
    return groups;
  };

  const getMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedPayments = groupPaymentsByMonth(payments);
  const sortedMonths = Object.keys(groupedPayments).sort().reverse();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
        <p className="text-gray-600 mt-1">Historial completo de pagos y estado de cuenta</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total pagado</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Este mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.paidThisMonth)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Este año</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.paidThisYear)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-5 ${summary.pendingBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${summary.pendingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Balance pendiente
                </p>
                <p className={`text-2xl font-bold mt-1 ${summary.pendingBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatCurrency(summary.pendingBalance)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${summary.pendingBalance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {summary.pendingBalance > 0 ? (
                  <Clock className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de pagos</h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedMonths.map(month => (
              <div key={month}>
                <div className="px-4 py-3 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 capitalize">
                    {getMonthLabel(month)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {groupedPayments[month].length} pagos - Total:{' '}
                    {formatCurrency(
                      groupedPayments[month]
                        .filter(p => p.status === 'COMPLETED')
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedPayments[month].map(payment => {
                    const method = paymentMethodConfig[payment.paymentMethod];
                    const status = statusConfig[payment.status];
                    const MethodIcon = method.icon;
                    const StatusIcon = status.icon;

                    return (
                      <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 bg-gray-100 rounded-lg ${method.color}`}>
                              <MethodIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {method.label}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Factura #{payment.invoice.invoiceNumber}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(payment.paymentDate)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            {payment.transactionId && (
                              <p className="text-xs text-gray-400">
                                Ref: {payment.transactionId.slice(0, 12)}...
                              </p>
                            )}
                          </div>
                        </div>

                        {payment.notes && (
                          <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download Statement */}
      {payments.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Descargar estado de cuenta
          </button>
        </div>
      )}
    </div>
  );
}
