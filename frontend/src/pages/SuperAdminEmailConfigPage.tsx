import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  TestTube,
  Server,
  Shield,
  X,
} from 'lucide-react';

interface EmailConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  replyToEmail: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastTestedAt: string | null;
  testResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminEmailConfigPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/email/config/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:3000/api/admin/email/config', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error('Error creating config:', error);
      alert(error.response?.data?.message || 'Error al crear configuración');
    }
  };

  const handleUpdate = async () => {
    if (!editingConfig) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`http://localhost:3000/api/admin/email/config/${editingConfig.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error('Error updating config:', error);
      alert(error.response?.data?.message || 'Error al actualizar configuración');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:3000/api/admin/email/config/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConfigs();
    } catch (error: any) {
      console.error('Error deleting config:', error);
      alert(error.response?.data?.message || 'Error al eliminar configuración');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`http://localhost:3000/api/admin/email/config/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConfigs();
    } catch (error) {
      console.error('Error activating config:', error);
    }
  };

  const handleTest = async (id: string) => {
    if (!testEmail) {
      alert('Por favor ingresa un email de prueba');
      return;
    }

    try {
      setTestingConfig(id);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:3000/api/admin/email/config/${id}/test`,
        { testEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Email de prueba enviado exitosamente');
      setTestEmail('');
      fetchConfigs();
    } catch (error: any) {
      console.error('Error testing config:', error);
      alert(error.response?.data?.message || 'Error al probar configuración');
    } finally {
      setTestingConfig(null);
    }
  };

  const resetForm = () => {
    setFormData({
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
      fromEmail: '',
      fromName: '',
      replyToEmail: '',
    });
    setShowModal(false);
    setEditingConfig(null);
  };

  const openEditModal = (config: EmailConfig) => {
    setEditingConfig(config);
    setFormData({
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpPassword: '********',
      smtpSecure: config.smtpSecure,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail || '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Configuración de Email (SMTP)</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona las configuraciones de servidor SMTP</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nueva Configuración
        </button>
      </div>

      {/* Config Cards */}
      <div className="grid gap-4 sm:gap-6">
        {configs.map((config) => (
          <div
            key={config.id}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 sm:p-6 ${
              config.isActive ? 'border-green-500' : 'border-gray-200'
            }`}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-3 rounded-lg ${config.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Server className={`w-5 h-5 sm:w-6 sm:h-6 ${config.isActive ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{config.smtpHost}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 break-all">{config.fromEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {config.isActive ? (
                  <span className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Activa
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivate(config.id)}
                    className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-200"
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>

            {/* Config Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Host SMTP</p>
                <p className="text-sm sm:text-base font-medium">{config.smtpHost}:{config.smtpPort}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Usuario</p>
                <p className="text-sm sm:text-base font-medium break-all">{config.smtpUser}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Nombre Remitente</p>
                <p className="text-sm sm:text-base font-medium">{config.fromName}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Seguridad</p>
                <p className="text-sm sm:text-base font-medium flex items-center gap-1">
                  {config.smtpSecure ? (
                    <>
                      <Shield className="w-4 h-4 text-green-600" />
                      SSL/TLS
                    </>
                  ) : (
                    'Sin cifrado'
                  )}
                </p>
              </div>
            </div>

            {/* Last Test Info */}
            {config.lastTestedAt && (
              <div className="mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-900">
                  Última prueba: {new Date(config.lastTestedAt).toLocaleString()}
                </p>
                {config.testResult && (
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">{config.testResult}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t">
              <input
                type="email"
                placeholder="Email de prueba"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(config.id)}
                  disabled={testingConfig === config.id}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="sm:inline">{testingConfig === config.id ? 'Probando...' : 'Probar'}</span>
                </button>
                <button
                  onClick={() => openEditModal(config)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {configs.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No hay configuraciones SMTP</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm sm:text-base text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Crear primera configuración
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showModal || editingConfig) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingConfig ? 'Editar Configuración' : 'Nueva Configuración SMTP'}
              </h2>
              <button
                onClick={resetForm}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Host SMTP *
                  </label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Puerto *
                  </label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Usuario SMTP *
                </label>
                <input
                  type="text"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Contraseña SMTP *
                </label>
                <input
                  type="password"
                  value={formData.smtpPassword}
                  onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                  placeholder={editingConfig ? 'Dejar en blanco para mantener' : 'Contraseña'}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={formData.smtpSecure}
                  onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="smtpSecure" className="text-xs sm:text-sm font-medium text-gray-700">
                  Usar SSL/TLS (Recomendado)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email Remitente *
                  </label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    placeholder="noreply@denticloud.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nombre Remitente *
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    placeholder="DentiCloud"
                    className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email de Respuesta (Opcional)
                </label>
                <input
                  type="email"
                  value={formData.replyToEmail}
                  onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                  placeholder="soporte@denticloud.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={editingConfig ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
              >
                {editingConfig ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
