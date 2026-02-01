import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAPI } from '../services/api';
import { Shield, Users, Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface StaffMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: string;
  permissions: string[] | null;
  status: string;
}

const PERMISSION_GROUPS = {
  patients: {
    label: 'Patients',
    description: 'Manage patient records and medical history',
    permissions: [
      { key: 'patients.view', label: 'View patients' },
      { key: 'patients.create', label: 'Create patients' },
      { key: 'patients.edit', label: 'Edit patients' },
      { key: 'patients.delete', label: 'Delete patients' },
      { key: 'patients.medical_history', label: 'View medical history' },
    ],
  },
  appointments: {
    label: 'Appointments',
    description: 'Schedule and manage appointments',
    permissions: [
      { key: 'appointments.view', label: 'View appointments' },
      { key: 'appointments.create', label: 'Create appointments' },
      { key: 'appointments.edit', label: 'Edit appointments' },
      { key: 'appointments.cancel', label: 'Cancel appointments' },
    ],
  },
  billing: {
    label: 'Billing & Invoices',
    description: 'Manage invoices and payments',
    permissions: [
      { key: 'invoices.view', label: 'View invoices' },
      { key: 'invoices.create', label: 'Create invoices' },
      { key: 'invoices.edit', label: 'Edit invoices' },
      { key: 'payments.view', label: 'View payments' },
      { key: 'payments.record', label: 'Record payments' },
    ],
  },
  treatments: {
    label: 'Treatment Plans',
    description: 'Manage treatment plans and procedures',
    permissions: [
      { key: 'treatments.view', label: 'View treatment plans' },
      { key: 'treatments.create', label: 'Create treatment plans' },
      { key: 'treatments.edit', label: 'Edit treatment plans' },
      { key: 'treatments.approve', label: 'Approve treatment plans' },
    ],
  },
  documents: {
    label: 'Documents',
    description: 'Manage patient documents and files',
    permissions: [
      { key: 'documents.view', label: 'View documents' },
      { key: 'documents.upload', label: 'Upload documents' },
      { key: 'documents.delete', label: 'Delete documents' },
    ],
  },
  reports: {
    label: 'Reports',
    description: 'Access analytics and reports',
    permissions: [
      { key: 'reports.view', label: 'View reports' },
      { key: 'reports.export', label: 'Export reports' },
      { key: 'reports.financial', label: 'View financial reports' },
    ],
  },
  settings: {
    label: 'Settings',
    description: 'Configure clinic settings',
    permissions: [
      { key: 'settings.view', label: 'View settings' },
      { key: 'settings.edit', label: 'Edit settings' },
      { key: 'staff.manage', label: 'Manage staff' },
    ],
  },
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  DENTIST: Object.values(PERMISSION_GROUPS).flatMap((g) => g.permissions.map((p) => p.key)),
  STAFF_RECEPTIONIST: [
    'patients.view',
    'patients.create',
    'patients.edit',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.cancel',
    'documents.view',
    'documents.upload',
  ],
  STAFF_BILLING: [
    'patients.view',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'payments.view',
    'payments.record',
    'reports.view',
    'reports.financial',
  ],
  STAFF_ASSISTANT: [
    'patients.view',
    'patients.medical_history',
    'appointments.view',
    'treatments.view',
    'documents.view',
    'documents.upload',
  ],
};

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['patients', 'appointments']);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: staffAPI.getAll,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      staffAPI.update(id, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setSelectedMember(null);
    },
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const togglePermission = (permission: string) => {
    setEditedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroupPermissions = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    const groupPermissions = group.permissions.map((p) => p.key);
    const allSelected = groupPermissions.every((p) => editedPermissions.includes(p));

    if (allSelected) {
      setEditedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
    } else {
      setEditedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  const selectMember = (member: StaffMember) => {
    setSelectedMember(member);
    setEditedPermissions(
      member.permissions || ROLE_DEFAULT_PERMISSIONS[member.role] || []
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DENTIST':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF_RECEPTIONIST':
        return 'bg-blue-100 text-blue-800';
      case 'STAFF_BILLING':
        return 'bg-green-100 text-green-800';
      case 'STAFF_ASSISTANT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('STAFF_', '').replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 sm:mb-8 flex items-center gap-3">
        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Permissions</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage what each staff member can access and do
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 sm:p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Staff Members
              </h2>
            </div>
            <div className="divide-y max-h-[400px] lg:max-h-[600px] overflow-y-auto">
              {staffMembers?.map((member: StaffMember) => (
                <button
                  key={member.id}
                  onClick={() => selectMember(member)}
                  className={`w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition ${
                    selectedMember?.id === member.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{member.user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{member.user.email}</p>
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {formatRole(member.role)}
                  </span>
                </button>
              ))}
              {(!staffMembers || staffMembers.length === 0) && (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm sm:text-base">No staff members found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold truncate">{selectedMember.user.name}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{selectedMember.user.email}</p>
                  </div>
                  <span
                    className={`self-start sm:self-auto text-xs sm:text-sm px-3 py-1 rounded-full flex-shrink-0 ${getRoleBadgeColor(
                      selectedMember.role
                    )}`}
                  >
                    {formatRole(selectedMember.role)}
                  </span>
                </div>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-blue-700">
                    <p className="font-medium">Custom Permissions</p>
                    <p>
                      Override the default permissions for this role. Unchecked permissions will be
                      denied even if typically allowed for this role.
                    </p>
                  </div>
                </div>

                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                  const isExpanded = expandedGroups.includes(groupKey);
                  const groupPermissions = group.permissions.map((p) => p.key);
                  const selectedCount = groupPermissions.filter((p) =>
                    editedPermissions.includes(p)
                  ).length;
                  const allSelected = selectedCount === groupPermissions.length;
                  const someSelected = selectedCount > 0 && !allSelected;

                  return (
                    <div key={groupKey} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="w-full p-3 sm:p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupPermissions(groupKey);
                            }}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${
                              allSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : someSelected
                                ? 'bg-blue-100 border-blue-300'
                                : 'border-gray-300'
                            }`}
                          >
                            {allSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                            {someSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-sm" />}
                          </button>
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm sm:text-base">{group.label}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-gray-500">
                            {selectedCount}/{groupPermissions.length}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.permissions.map((permission) => {
                            const isChecked = editedPermissions.includes(permission.key);
                            return (
                              <label
                                key={permission.key}
                                className="flex items-center gap-2 sm:gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(permission.key)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-xs sm:text-sm">{permission.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updatePermissionsMutation.mutate({
                      id: selectedMember.id,
                      permissions: editedPermissions,
                    })
                  }
                  disabled={updatePermissionsMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Shield className="w-4 h-4" />
                  {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Select a staff member
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                Choose a staff member from the list to view and edit their permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
