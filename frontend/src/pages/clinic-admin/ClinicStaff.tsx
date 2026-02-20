import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicAdminAPI } from '../../services/api';
import type { ClinicStaffMember } from '../../types';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

const ROLES = [
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
] as const;

function getRoleBadge(role: string) {
  switch (role) {
    case 'RECEPTIONIST':
      return { label: 'Recepcionista', className: 'bg-blue-50 text-blue-700' };
    case 'ADMIN':
      return { label: 'Administrador', className: 'bg-purple-50 text-purple-700' };
    case 'MAINTENANCE':
      return { label: 'Mantenimiento', className: 'bg-orange-50 text-orange-700' };
    default:
      return { label: role, className: 'bg-gray-50 text-gray-700' };
  }
}

export default function ClinicStaff() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState<ClinicStaffMember | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('RECEPTIONIST');
  const [editRole, setEditRole] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery<ClinicStaffMember[]>({
    queryKey: ['clinicStaff'],
    queryFn: clinicAdminAPI.getStaff,
  });

  const addMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) => clinicAdminAPI.addStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicStaff'] });
      setShowAddModal(false);
      setNewUserId('');
      setNewRole('RECEPTIONIST');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; isActive?: boolean } }) =>
      clinicAdminAPI.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicStaff'] });
      setEditStaff(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => clinicAdminAPI.removeStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinicStaff'] }),
  });

  const filteredStaff = staff?.filter((s) => showInactive || s.isActive) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-500">Cargando personal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personal de la Clinica</h1>
            <p className="text-gray-500">Gestion del equipo</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Agregar Personal
        </button>
      </div>

      {/* Show inactive toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="rounded"
        />
        Mostrar inactivos
      </label>

      {/* Empty state */}
      {!filteredStaff.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No hay personal registrado</h3>
          <p className="text-sm text-gray-500 mt-1">
            Agrega miembros del equipo para gestionar la clinica.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((member) => {
                  const roleBadge = getRoleBadge(member.role);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium truncate max-w-[200px]">
                            {member.userId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(member.createdAt).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {member.isActive ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditStaff(member);
                                  setEditRole(member.role);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Estas seguro de desactivar este miembro del personal?'
                                    )
                                  ) {
                                    removeMutation.mutate(member.id);
                                  }
                                }}
                                disabled={removeMutation.isPending}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Desactivar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  id: member.id,
                                  data: { isActive: true },
                                })
                              }
                              disabled={updateMutation.isPending}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Reactivar"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredStaff.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.userId}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                        {member.isActive ? (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Desde:{' '}
                        {new Date(member.createdAt).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {member.isActive ? (
                      <>
                        <button
                          onClick={() => {
                            setEditStaff(member);
                            setEditRole(member.role);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                'Estas seguro de desactivar este miembro del personal?'
                              )
                            ) {
                              removeMutation.mutate(member.id);
                            }
                          }}
                          disabled={removeMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Desactivar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          updateMutation.mutate({
                            id: member.id,
                            data: { isActive: true },
                          })
                        }
                        disabled={updateMutation.isPending}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Personal</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUserId('');
                  setNewRole('RECEPTIONIST');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserId.trim()) return;
                addMutation.mutate({ userId: newUserId.trim(), role: newRole });
              }}
              className="p-4 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Usuario *
                </label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="ID del usuario a agregar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUserId('');
                    setNewRole('RECEPTIONIST');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newUserId.trim() || addMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {addMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Editar Personal</h2>
              <button
                onClick={() => setEditStaff(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editStaff.id,
                  data: { role: editRole },
                });
              }}
              className="p-4 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Usuario
                </label>
                <p className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                  {editStaff.userId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditStaff(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
