import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  { value: 'WELCOME', label: 'Bienvenida' },
  { value: 'TRIAL_EXPIRING', label: 'Trial Expirando' },
  { value: 'TRIAL_EXPIRED', label: 'Trial Expirado' },
  { value: 'SUBSCRIPTION_ACTIVATED', label: 'Suscripcion Activada' },
  { value: 'SUBSCRIPTION_CANCELLED', label: 'Suscripcion Cancelada' },
  { value: 'PAYMENT_SUCCESS', label: 'Pago Exitoso' },
  { value: 'PAYMENT_FAILED', label: 'Pago Fallido' },
  { value: 'PASSWORD_RESET', label: 'Restablecer Contrasena' },
  { value: 'INVITATION', label: 'Invitacion' },
  { value: 'SUPPORT_TICKET_CREATED', label: 'Ticket Creado' },
  { value: 'SUPPORT_TICKET_UPDATED', label: 'Ticket Actualizado' },
  { value: 'TENANT_CREATED', label: 'Tenant Creado' },
  { value: 'USER_CREATED', label: 'Usuario Creado' },
];

export default function SuperAdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [statistics, setStatistics] = useState({ total: 0, active: 0, inactive: 0 });

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    subject: '',
    htmlBody: '',
    textBody: '',
    variables: [] as string[],
  });

  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchStatistics();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/email/templates', {
        headers: { Authorization: `Bearer ${token}` },
        params: { includeInactive: 'true' },
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/email/templates/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:3000/api/admin/email/templates', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      resetForm();
      fetchTemplates();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error creating template:', error);
      alert(error.response?.data?.message || 'Error al crear plantilla');
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`http://localhost:3000/api/admin/email/templates/${editingTemplate.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error('Error updating template:', error);
      alert(error.response?.data?.message || 'Error al actualizar plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar esta plantilla?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:3000/api/admin/email/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.message || 'Error al eliminar plantilla');
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = template.isActive ? 'deactivate' : 'activate';
      await axios.post(`http://localhost:3000/api/admin/email/templates/${template.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
      fetchStatistics();
    } catch (error) {
      console.error('Error toggling template status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      description: '',
      subject: '',
      htmlBody: '',
      textBody: '',
      variables: [],
    });
    setShowModal(false);
    setEditingTemplate(null);
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody || '',
      variables: template.variables,
    });
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({ ...formData, variables: [...formData.variables, newVariable] });
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({ ...formData, variables: formData.variables.filter(v => v !== variable) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando plantillas...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Plantillas de Email</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona las plantillas de correo electronico</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Plantillas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Activas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Inactivas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 ${
              template.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    {TEMPLATE_TYPES.find(t => t.value === template.type)?.label || template.type}
                  </span>
                  {template.isActive ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle className="w-3 h-3" />
                      Activa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      <XCircle className="w-3 h-3" />
                      Inactiva
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">{template.description}</p>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Asunto:</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{template.subject}</p>
                  </div>
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Variables:</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Vista previa"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`p-2 rounded-lg ${
                    template.isActive
                      ? 'text-yellow-600 hover:bg-yellow-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={template.isActive ? 'Desactivar' : 'Activar'}
                >
                  {template.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No hay plantillas de email</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm sm:text-base"
            >
              Crear primera plantilla
            </button>
          </div>
        )}
      </div>

      {(showModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Email'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Tipo de Plantilla *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg"
                    disabled={!!editingTemplate}
                  >
                    <option value="">Seleccionar tipo</option>
                    {TEMPLATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la plantilla"
                    className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripcion breve"
                  className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Asunto *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Asunto del email (usa {{variable}} para variables dinamicas)"
                  className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Variables Disponibles
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="Nombre de variable (ej: userName)"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                  />
                  <button
                    onClick={addVariable}
                    className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable) => (
                    <span
                      key={variable}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm font-mono rounded"
                    >
                      {`{{${variable}}}`}
                      <button
                        onClick={() => removeVariable(variable)}
                        className="ml-1 text-blue-900 hover:text-blue-700"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cuerpo HTML *
                </label>
                <textarea
                  value={formData.htmlBody}
                  onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                  placeholder="Contenido HTML del email"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs sm:text-sm"
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cuerpo Texto Plano (Opcional)
                </label>
                <textarea
                  value={formData.textBody}
                  onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
                  placeholder="Version en texto plano del email"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs sm:text-sm"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
              >
                {editingTemplate ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Vista Previa: {previewTemplate.name}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Asunto:</p>
                <p className="text-sm sm:text-base text-gray-900">{previewTemplate.subject}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Contenido HTML:</p>
                <div
                  className="border rounded-lg p-3 sm:p-4 bg-gray-50 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.htmlBody }}
                />
              </div>

              {previewTemplate.textBody && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Contenido Texto Plano:</p>
                  <pre className="border rounded-lg p-3 sm:p-4 bg-gray-50 text-xs sm:text-sm whitespace-pre-wrap">
                    {previewTemplate.textBody}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
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
