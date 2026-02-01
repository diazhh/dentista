import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  X,
} from 'lucide-react';

interface EmailLog {
  id: string;
  templateId: string | null;
  to: string;
  from: string;
  subject: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  metadata: any;
  createdAt: string;
}

export default function SuperAdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [filter, setFilter] = useState({
    templateId: '',
    limit: 50,
  });

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params: any = { limit: filter.limit };
      if (filter.templateId) {
        params.templateId = filter.templateId;
      }

      const response = await axios.get('http://localhost:3000/api/admin/email/logs', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <CheckCircle className="w-3 h-3" />
            Enviado
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            <XCircle className="w-3 h-3" />
            Fallido
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Logs de Emails</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Historial de emails enviados por el sistema</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-xs sm:text-sm text-gray-600 mr-2">Límite:</label>
            <select
              value={filter.limit}
              onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
              className="px-3 py-1.5 sm:py-1 border rounded-lg text-sm sm:text-base w-full sm:w-auto"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinatario
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asunto
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{log.to}</div>
                    <div className="text-sm text-gray-500">De: {log.from}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-900">{log.subject}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleString()
                        : new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs">
                      {log.openedAt && (
                        <span className="text-green-600">Abierto</span>
                      )}
                      {log.clickedAt && (
                        <span className="text-blue-600">Click</span>
                      )}
                      {!log.openedAt && !log.clickedAt && (
                        <span className="text-gray-400">Sin tracking</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay logs de emails</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No hay logs de emails</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <div className="flex justify-between items-start mb-3">
                {getStatusBadge(log.status)}
                <button
                  onClick={() => setSelectedLog(log)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Destinatario</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{log.to}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Asunto</p>
                  <p className="text-sm text-gray-900 line-clamp-2">{log.subject}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="text-sm text-gray-900">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleDateString()
                        : new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tracking</p>
                    <div className="flex gap-2 text-xs">
                      {log.openedAt && <span className="text-green-600">Abierto</span>}
                      {log.clickedAt && <span className="text-blue-600">Click</span>}
                      {!log.openedAt && !log.clickedAt && (
                        <span className="text-gray-400">Sin tracking</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Detalles del Email</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Estado:</p>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">ID:</p>
                  <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">{selectedLog.id}</p>
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Destinatario:</p>
                <p className="text-sm text-gray-900 break-all">{selectedLog.to}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Remitente:</p>
                <p className="text-sm text-gray-900 break-all">{selectedLog.from}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Asunto:</p>
                <p className="text-sm text-gray-900">{selectedLog.subject}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Creado:</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedLog.sentAt && (
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Enviado:</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedLog.sentAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.openedAt && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Abierto:</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.openedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedLog.clickedAt && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Click:</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.clickedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedLog.error && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-700">Error:</p>
                  <pre className="mt-1 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-900 whitespace-pre-wrap overflow-x-auto">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Metadata:</p>
                  <pre className="mt-1 p-2 sm:p-3 bg-gray-50 border rounded-lg text-xs sm:text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm sm:text-base rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
