import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { staffAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Workspace {
  id: string;
  tenantId: string;
  tenantName: string;
  role: string;
  status: string;
}

export default function TenantSwitcher() {
  const { user, switchTenant } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current tenant from user context
  const currentTenantId = (user as any)?.tenantId;

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await staffAPI.getMyWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (tenantId === currentTenantId || switching) return;

    try {
      setSwitching(true);
      await switchTenant(tenantId);
      setIsOpen(false);
      // Reload to apply new tenant context
      window.location.reload();
    } catch (error) {
      console.error('Error switching tenant:', error);
      alert('Error al cambiar de clínica');
    } finally {
      setSwitching(false);
    }
  };

  const currentWorkspace = workspaces.find((w) => w.tenantId === currentTenantId);
  const activeWorkspaces = workspaces.filter((w) => w.status === 'ACTIVE');

  // Don't show if user has only one workspace
  if (!loading && activeWorkspaces.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || switching}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
      >
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 max-w-[150px] truncate">
          {loading ? 'Cargando...' : currentWorkspace?.tenantName || 'Seleccionar clínica'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Mis Clínicas
          </div>

          {activeWorkspaces.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No tienes clínicas activas
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {activeWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitchTenant(workspace.tenantId)}
                  disabled={switching}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    workspace.tenantId === currentTenantId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      workspace.tenantId === currentTenantId
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        workspace.tenantId === currentTenantId ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {workspace.tenantName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {workspace.role.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  {workspace.tenantId === currentTenantId && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Pending invitations */}
          {workspaces.filter((w) => w.status === 'PENDING_INVITATION').length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Invitaciones Pendientes
              </div>
              {workspaces
                .filter((w) => w.status === 'PENDING_INVITATION')
                .map((workspace) => (
                  <div
                    key={workspace.id}
                    className="flex items-center gap-3 px-3 py-2 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {workspace.tenantName}
                      </p>
                      <p className="text-xs text-yellow-600">Pendiente de aceptar</p>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
