import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Trash2, User, Calendar, DollarSign, Plus, CreditCard } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  terms?: string;
  patient?: {
    firstName: string;
    lastName: string;
    documentId: string;
    phone: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    status: string;
    transactionId?: string;
    reference?: string;
    notes?: string;
  }>;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoice(response.data);
      setPaymentData({ ...paymentData, amount: response.data.balance });
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/payments',
        {
          invoiceId: id,
          ...paymentData,
          transactionId: paymentData.transactionId || undefined,
          reference: paymentData.reference || undefined,
          notes: paymentData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowPaymentModal(false);
      fetchInvoice();
      setPaymentData({
        amount: 0,
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: '',
        reference: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      alert(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/invoices/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchInvoice();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar esta factura?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error al eliminar la factura');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-200 text-red-900',
      PENDING: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada',
      PENDING: 'Pendiente',
      COMPLETED: 'Completado',
      FAILED: 'Fallido',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia Bancaria',
      CHECK: 'Cheque',
      OTHER: 'Otro',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Factura no encontrada</p>
          <button onClick={() => navigate('/invoices')} className="mt-4 text-blue-600 hover:underline">
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Factura {invoice.invoiceNumber}</h1>
                <p className="text-gray-500">{getStatusBadge(invoice.status)}</p>
              </div>
            </div>
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Paciente</h3>
            </div>
            <p className="text-lg font-medium text-gray-900">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
            <p className="text-sm text-gray-500">Cédula: {invoice.patient?.documentId}</p>
            <p className="text-sm text-gray-500">Tel: {invoice.patient?.phone}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Fechas</h3>
            </div>
            <p className="text-sm text-gray-500">Emisión: <span className="font-medium text-gray-900">{format(new Date(invoice.issueDate), 'dd MMM yyyy', { locale: es })}</span></p>
            <p className="text-sm text-gray-500">Vencimiento: <span className="font-medium text-gray-900">{format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: es })}</span></p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Resumen</h3>
            </div>
            <p className="text-sm text-gray-500">Total: <span className="font-medium text-gray-900">${invoice.total.toLocaleString('es-CO')}</span></p>
            <p className="text-sm text-gray-500">Pagado: <span className="font-medium text-green-600">${invoice.amountPaid.toLocaleString('es-CO')}</span></p>
            <p className="text-sm text-gray-500">Saldo: <span className="font-medium text-amber-600">${invoice.balance.toLocaleString('es-CO')}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de la Factura</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleUpdateStatus('DRAFT')} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">Borrador</button>
            <button onClick={() => handleUpdateStatus('SENT')} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">Enviada</button>
            <button onClick={() => handleUpdateStatus('PAID')} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors">Pagada</button>
            <button onClick={() => handleUpdateStatus('OVERDUE')} className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">Vencida</button>
            <button onClick={() => handleUpdateStatus('CANCELLED')} className="px-4 py-2 bg-red-200 text-red-900 rounded-lg hover:bg-red-300 transition-colors">Cancelada</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items de la Factura</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">${item.unitPrice.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.total.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${invoice.subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Impuesto:</span>
              <span className="font-medium">${invoice.tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descuento:</span>
              <span className="font-medium text-red-600">-${invoice.discount.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${invoice.total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pagos Registrados</h3>
            {invoice.balance > 0 && (
              <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-5 h-5" />
                Registrar Pago
              </button>
            )}
          </div>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="space-y-3">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">${payment.amount.toLocaleString('es-CO')}</p>
                        <p className="text-sm text-gray-500">{getPaymentMethodLabel(payment.paymentMethod)} - {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: es })}</p>
                        {payment.reference && <p className="text-xs text-gray-400">Ref: {payment.reference}</p>}
                      </div>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
          )}
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {invoice.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Términos y Condiciones</h4>
                <p className="text-gray-600">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago</h3>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto *</label>
                  <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })} required min="0.01" max={invoice.balance} step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p className="text-xs text-gray-500 mt-1">Saldo pendiente: ${invoice.balance.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago *</label>
                  <select value={paymentData.paymentMethod} onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="CASH">Efectivo</option>
                    <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                    <option value="DEBIT_CARD">Tarjeta de Débito</option>
                    <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                    <option value="CHECK">Cheque</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Pago *</label>
                  <input type="date" value={paymentData.paymentDate} onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID de Transacción</label>
                  <input type="text" value={paymentData.transactionId} onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                  <input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Registrar Pago</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
