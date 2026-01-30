import { useState, useEffect } from 'react';
import { FileText, CreditCard, Download, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  items: InvoiceItem[];
  payments: Payment[];
  notes?: string;
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Clock },
  PAID: { label: 'Pagada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  OVERDUE: { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500', icon: X },
};

export default function PatientInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/portal/invoices');
      setInvoices(response.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;

    setPaymentLoading(true);
    setError('');

    try {
      // Create Stripe checkout session
      const response = await api.post('/stripe/create-invoice-checkout', {
        invoiceId: selectedInvoice.id,
        successUrl: `${window.location.origin}/patient/invoices?success=true`,
        cancelUrl: `${window.location.origin}/patient/invoices?canceled=true`,
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error al descargar el PDF');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
        <p className="text-gray-600 mt-1">Consulta y paga tus facturas pendientes</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  invoices
                    .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
                    .reduce((sum, i) => sum + i.balance, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagado este mes</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  invoices
                    .filter((i) => i.status === 'PAID')
                    .reduce((sum, i) => sum + i.amountPaid, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total facturas</p>
              <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tienes facturas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={invoice.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">
                          Factura #{invoice.invoiceNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <p>Fecha de emisión: {formatDate(invoice.issueDate)}</p>
                        <p>Fecha de vencimiento: {formatDate(invoice.dueDate)}</p>
                      </div>

                      {/* Items preview */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          {invoice.items.slice(0, 2).map((item) => item.description).join(', ')}
                          {invoice.items.length > 2 && ` y ${invoice.items.length - 2} más...`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      {invoice.balance > 0 && invoice.balance !== invoice.total && (
                        <p className="text-sm text-gray-500">
                          Balance: {formatCurrency(invoice.balance)}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleDownloadPdf(invoice.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>

                        {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') &&
                          invoice.balance > 0 && (
                            <button
                              onClick={() => handlePayNow(invoice)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pagar ahora
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Pagar Factura</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Invoice Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Factura</span>
                    <span className="font-medium">#{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Impuestos</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Descuento</span>
                      <span className="text-green-600">
                        -{formatCurrency(selectedInvoice.discount)}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.amountPaid > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Ya pagado</span>
                      <span className="text-green-600">
                        -{formatCurrency(selectedInvoice.amountPaid)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">A pagar</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedInvoice.balance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="text-sm text-gray-500">
                  <p className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Serás redirigido a Stripe para completar el pago de forma segura.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={paymentLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pagar {formatCurrency(selectedInvoice.balance)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
