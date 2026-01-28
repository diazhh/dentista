import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Search, Eye, Edit, Trash2, UserPlus, Filter, X, UserCog } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt: string;
  _count?: {
    tenantMemberships: number;
    ownedTenants: number;
  };
}

export default function SuperAdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersByRole: [] as any[],
    usersThisMonth: 0,
    activeUsers: 0,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', phone: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DENTIST',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`http://localhost:3000/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/api/admin/users/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    });
    setShowEditModal(true);
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:3000/api/admin/users', createForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'DENTIST',
        phone: '',
      });
      fetchUsers();
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`http://localhost:3000/api/admin/users/${editingUser.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      alert('Usuario actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!confirm('¿Estás seguro de impersonar este usuario?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Store the impersonation token
      localStorage.setItem('impersonationToken', response.data.token);
      localStorage.setItem('originalToken', token!);
      
      alert(`Impersonando a ${response.data.user.name}. Recarga la página para usar la sesión.`);
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      alert(error.response?.data?.message || 'Error al impersonar usuario');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      DENTIST: 'bg-blue-100 text-blue-800',
      STAFF_RECEPTIONIST: 'bg-green-100 text-green-800',
      STAFF_BILLING: 'bg-yellow-100 text-yellow-800',
      PATIENT: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra todos los usuarios de la plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Crear Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nuevos Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usersThisMonth}</p>
            </div>
            <UserPlus className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Roles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usersByRole.length}</p>
            </div>
            <Filter className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos los roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="DENTIST">Dentista</option>
            <option value="STAFF_RECEPTIONIST">Recepcionista</option>
            <option value="STAFF_BILLING">Billing</option>
            <option value="PATIENT">Paciente</option>
          </select>
          <button
            onClick={handleSearch}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'No hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membresías
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count?.tenantMemberships || 0} membresías
                    {user._count?.ownedTenants ? ` (${user._count.ownedTenants} propias)` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/superadmin/users/${user.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {user.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleImpersonate(user.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Impersonar usuario"
                        >
                          <UserCog className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="DENTIST">Dentista</option>
                  <option value="STAFF_RECEPTIONIST">Recepcionista</option>
                  <option value="STAFF_BILLING">Billing</option>
                  <option value="PATIENT">Paciente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
