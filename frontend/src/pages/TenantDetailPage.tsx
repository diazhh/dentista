import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  Users,
  CreditCard,
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  XCircle,
  CheckCircle,
  X,
  Mail,
  User,
  Shield
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  maxPatients: number;
  storageGB: number;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  memberships: any[];
  _count: {
    appointments: number;
    memberships: number;
    patientDentistRelations: number;
  };
}

interface TenantUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  joinedAt: string;
  createdAt: string;
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subdomain: '',
  });

  // Users management state
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'DENTIST',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoleForm, setEditRoleForm] = useState('');

  useEffect(() => {
    if (id) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenant(response.data);
      setEditForm({
        name: response.data.name,
        subdomain: response.data.subdomain,
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      alert('Error al cargar el tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`http://localhost:3000/api/admin/tenants/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditMode(false);
      fetchTenant();
      alert('Tenant actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      alert(error.response?.data?.message || 'Error al actualizar tenant');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Estas seguro de eliminar este tenant? Esta accion no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:3000/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Tenant eliminado exitosamente');
      navigate('/superadmin/tenants');
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      alert(error.response?.data?.message || 'Error al eliminar tenant');
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Estas seguro de suspender este tenant?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`http://localhost:3000/api/admin/tenants/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTenant();
      alert('Tenant suspendido exitosamente');
    } catch (error: any) {
      console.error('Error suspending tenant:', error);
      alert(error.response?.data?.message || 'Error al suspender tenant');
    }
  };

  const handleReactivate = async () => {
    if (!confirm('Estas seguro de reactivar este tenant?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`http://localhost:3000/api/admin/tenants/${id}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTenant();
      alert('Tenant reactivado exitosamente');
    } catch (error: any) {
      console.error('Error reactivating tenant:', error);
      alert(error.response?.data?.message || 'Error al reactivar tenant');
    }
  };

  // Tenant Users Management Functions
  const fetchTenantUsers = async () => {
    if (!id) return;
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/api/admin/tenants/${id}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenantUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tenant users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && id) {
      fetchTenantUsers();
    }
  }, [activeTab, id]);

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.name) {
      alert('Email y nombre son requeridos');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:3000/api/admin/tenants/${id}/users`,
        addUserForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddUserModal(false);
      setAddUserForm({ email: '', name: '', password: '', role: 'DENTIST' });
      fetchTenantUsers();
      fetchTenant();
      alert('Usuario agregado exitosamente');
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert(error.response?.data?.message || 'Error al agregar usuario');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `http://localhost:3000/api/admin/tenants/${id}/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingUserId(null);
      fetchTenantUsers();
      alert('Rol actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Error al actualizar rol');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Estas seguro de remover a ${userName} de este tenant?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `http://localhost:3000/api/admin/tenants/${id}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTenantUsers();
      fetchTenant();
      alert('Usuario removido exitosamente');
    } catch (error: any) {
      console.error('Error removing user:', error);
      alert(error.response?.data?.message || 'Error al remover usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Tenant no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/superadmin/tenants')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{tenant.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">{tenant.subdomain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tenant.subscriptionStatus === 'ACTIVE' ? (
            <button
              onClick={handleSuspend}
              className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm sm:text-base"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Suspender</span>
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Reactivar</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`${
              activeTab === 'info'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2`}
          >
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Info</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2`}
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Usuarios ({tenant.memberships.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`${
              activeTab === 'subscription'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2`}
          >
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Suscripcion</span>
            <span className="sm:hidden">Plan</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Informacion del Tenant</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-2 text-sm sm:text-base"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-1 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1 text-xs sm:text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
              {editMode ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                />
              ) : (
                <p className="text-gray-900 text-sm sm:text-base">{tenant.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subdomain</label>
              {editMode ? (
                <input
                  type="text"
                  value={editForm.subdomain}
                  onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                />
              ) : (
                <p className="text-gray-900 text-sm sm:text-base">{tenant.subdomain}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Owner</label>
              <p className="text-gray-900 text-sm sm:text-base">{tenant.owner.name}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{tenant.owner.email}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha de Creacion</label>
              <p className="text-gray-900 text-sm sm:text-base">{new Date(tenant.createdAt).toLocaleDateString('es-ES')}</p>
            </div>
          </div>

          <div className="border-t pt-4 sm:pt-6">
            <h3 className="text-sm sm:text-md font-semibold text-gray-900 mb-4">Estadisticas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Citas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{tenant._count.appointments}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Usuarios</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{tenant._count.memberships}</p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Pacientes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{tenant._count.patientDentistRelations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Usuarios del Tenant</h2>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <UserPlus className="h-4 w-4" />
              Agregar Usuario
            </button>
          </div>

          {usersLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Cargando usuarios...</div>
            </div>
          ) : tenantUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <p className="mt-2 text-xs sm:text-sm text-gray-500">No hay usuarios en este tenant</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {tenantUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditRoleForm(user.role);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                          <select
                            value={editRoleForm}
                            onChange={(e) => setEditRoleForm(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="DENTIST">DENTIST</option>
                            <option value="STAFF_RECEPTIONIST">RECEPTIONIST</option>
                            <option value="STAFF_BILLING">BILLING</option>
                            <option value="STAFF_ASSISTANT">ASSISTANT</option>
                          </select>
                          <button
                            onClick={() => handleUpdateUserRole(user.id, editRoleForm)}
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {user.phone && (
                        <p className="text-sm text-gray-500 ml-6">{user.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRoleForm}
                            onChange={(e) => setEditRoleForm(e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="DENTIST">DENTIST</option>
                            <option value="STAFF_RECEPTIONIST">STAFF_RECEPTIONIST</option>
                            <option value="STAFF_BILLING">STAFF_BILLING</option>
                            <option value="STAFF_ASSISTANT">STAFF_ASSISTANT</option>
                          </select>
                          <button
                            onClick={() => handleUpdateUserRole(user.id, editRoleForm)}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setEditRoleForm(user.role);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Agregar Usuario</h3>
                  <button
                    onClick={() => {
                      setShowAddUserModal(false);
                      setAddUserForm({ email: '', name: '', password: '', role: 'DENTIST' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contrasena</label>
                    <input
                      type="password"
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                      placeholder="Dejar vacio para generar automatica"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                    >
                      <option value="DENTIST">Dentista</option>
                      <option value="STAFF_RECEPTIONIST">Recepcionista</option>
                      <option value="STAFF_BILLING">Facturacion</option>
                      <option value="STAFF_ASSISTANT">Asistente</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowAddUserModal(false);
                      setAddUserForm({ email: '', name: '', password: '', role: 'DENTIST' });
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Suscripcion</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Plan</label>
              <p className="text-gray-900 font-semibold text-sm sm:text-base">{tenant.subscriptionTier}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
              <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                tenant.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                tenant.subscriptionStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tenant.subscriptionStatus}
              </span>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Maximo de Pacientes</label>
              <p className="text-gray-900 text-sm sm:text-base">{tenant.maxPatients}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
              <p className="text-gray-900 text-sm sm:text-base">{tenant.storageGB} GB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
