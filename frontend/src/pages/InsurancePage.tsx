import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Search, Edit, Trash2, X, CheckCircle, XCircle, Clock, Building2, FileText } from 'lucide-react';
import { insuranceAPI } from '../services/api';

interface InsuranceProvider {
  id: string;
  name: string;
  code: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  coverageDetails: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
}

interface PatientInsurance {
  id: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  groupNumber: string | null;
  subscriberName: string | null;
  subscriberRelation: string | null;
  coverageType: string | null;
  effectiveDate: string;
  expirationDate: string | null;
  isActive: boolean;
  isPrimary: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  verificationNotes: string | null;
  copayAmount: number | null;
  coinsurancePercent: number | null;
  deductible: number | null;
  maxAnnualBenefit: number | null;
  usedBenefit: number | null;
  createdAt: string;
  patient?: { firstName: string; lastName: string; documentId: string };
  insuranceProvider?: { name: string; code: string | null };
}

type TabKey = 'providers' | 'policies';

const COVERAGE_TYPES = [
  { value: 'BASIC', label: 'Basico' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'COMPLEMENTARY', label: 'Complementario' },
];

const SUBSCRIBER_RELATIONS = [
  { value: 'SELF', label: 'Titular' },
  { value: 'SPOUSE', label: 'Conyuge' },
  { value: 'CHILD', label: 'Hijo/a' },
  { value: 'OTHER', label: 'Otro' },
];

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  VERIFIED: { color: 'bg-green-100 text-green-800', label: 'Verificado' },
  REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rechazado' },
  EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expirado' },
};

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('providers');
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [policies, setPolicies] = useState<PatientInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Provider form state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editProvider, setEditProvider] = useState<InsuranceProvider | null>(null);
  const [providerForm, setProviderForm] = useState({
    name: '', code: '', contactPhone: '', contactEmail: '', website: '',
  });

  // Verify modal state
  const [verifyModal, setVerifyModal] = useState<PatientInsurance | null>(null);
  const [verifyData, setVerifyData] = useState({ verificationStatus: 'VERIFIED', verificationNotes: '' });

  const loadProviders = useCallback(async () => {
    try {
      const data = await insuranceAPI.getProviders(true);
      setProviders(data);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  }, []);

  const loadPolicies = useCallback(async () => {
    try {
      // Load all providers to find associated policies
      const provs = await insuranceAPI.getProviders(true);
      setProviders(provs);
      // We don't have a "list all policies" endpoint, but we can use the providers list
      // For now, the policies tab shows providers and their patient counts
      // In a real scenario, you'd have a dedicated endpoint
    } catch (err) {
      console.error('Error loading policies:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await loadProviders();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadProviders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Provider CRUD
  const handleProviderSubmit = async () => {
    try {
      if (editProvider) {
        await insuranceAPI.updateProvider(editProvider.id, providerForm);
      } else {
        await insuranceAPI.createProvider(providerForm);
      }
      setShowProviderForm(false);
      setEditProvider(null);
      setProviderForm({ name: '', code: '', contactPhone: '', contactEmail: '', website: '' });
      loadProviders();
    } catch (err) {
      console.error('Error saving provider:', err);
    }
  };

  const handleEditProvider = (p: InsuranceProvider) => {
    setEditProvider(p);
    setProviderForm({
      name: p.name,
      code: p.code || '',
      contactPhone: p.contactPhone || '',
      contactEmail: p.contactEmail || '',
      website: p.website || '',
    });
    setShowProviderForm(true);
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Eliminar esta aseguradora?')) return;
    try {
      await insuranceAPI.deleteProvider(id);
      loadProviders();
    } catch (err) {
      console.error('Error deleting provider:', err);
    }
  };

  const handleToggleProvider = async (p: InsuranceProvider) => {
    try {
      await insuranceAPI.updateProvider(p.id, { isActive: !p.isActive });
      loadProviders();
    } catch (err) {
      console.error('Error toggling provider:', err);
    }
  };

  // Verify insurance
  const handleVerify = async () => {
    if (!verifyModal) return;
    try {
      await insuranceAPI.verifyInsurance(verifyModal.id, verifyData);
      setVerifyModal(null);
      setVerifyData({ verificationStatus: 'VERIFIED', verificationNotes: '' });
    } catch (err) {
      console.error('Error verifying insurance:', err);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Seguros
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestionar aseguradoras y verificar polizas</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aseguradoras</p>
              <p className="text-xl font-bold">{providers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activas</p>
              <p className="text-xl font-bold">{providers.filter(p => p.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactivas</p>
              <p className="text-xl font-bold">{providers.filter(p => !p.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Con Codigo</p>
              <p className="text-xl font-bold">{providers.filter(p => p.code).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'providers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Aseguradoras
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'policies'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Directorio
          </button>
        </div>

        <div className="p-4">
          {/* Search + Add */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aseguradora..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {activeTab === 'providers' && (
              <button
                onClick={() => {
                  setEditProvider(null);
                  setProviderForm({ name: '', code: '', contactPhone: '', contactEmail: '', website: '' });
                  setShowProviderForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Nueva Aseguradora
              </button>
            )}
          </div>

          {activeTab === 'providers' && (
            <ProvidersTable
              providers={filteredProviders}
              onEdit={handleEditProvider}
              onDelete={handleDeleteProvider}
              onToggle={handleToggleProvider}
            />
          )}

          {activeTab === 'policies' && (
            <ProvidersDirectory providers={filteredProviders} />
          )}
        </div>
      </div>

      {/* Provider Form Modal */}
      {showProviderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editProvider ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
              </h3>
              <button onClick={() => setShowProviderForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Seguros Reservas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
                <input
                  type="text"
                  value={providerForm.code}
                  onChange={e => setProviderForm({ ...providerForm, code: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: SR-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={providerForm.contactPhone}
                    onChange={e => setProviderForm({ ...providerForm, contactPhone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="809-555-0100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={providerForm.contactEmail}
                    onChange={e => setProviderForm({ ...providerForm, contactEmail: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="contacto@aseguradora.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="url"
                  value={providerForm.website}
                  onChange={e => setProviderForm({ ...providerForm, website: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.aseguradora.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowProviderForm(false)}
                className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleProviderSubmit}
                disabled={!providerForm.name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editProvider ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Verificar Poliza</h3>
              <button onClick={() => setVerifyModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Poliza: <strong>{verifyModal.policyNumber}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Verificacion</label>
                <select
                  value={verifyData.verificationStatus}
                  onChange={e => setVerifyData({ ...verifyData, verificationStatus: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="VERIFIED">Verificado</option>
                  <option value="REJECTED">Rechazado</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={verifyData.verificationNotes}
                  onChange={e => setVerifyData({ ...verifyData, verificationNotes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Notas de verificacion..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setVerifyModal(null)}
                className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerify}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProvidersTable({
  providers,
  onEdit,
  onDelete,
  onToggle,
}: {
  providers: InsuranceProvider[];
  onEdit: (p: InsuranceProvider) => void;
  onDelete: (id: string) => void;
  onToggle: (p: InsuranceProvider) => void;
}) {
  if (providers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay aseguradoras registradas</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Nombre</th>
              <th className="pb-3 font-medium">Codigo</th>
              <th className="pb-3 font-medium">Telefono</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                      {p.website}
                    </a>
                  )}
                </td>
                <td className="py-3 text-gray-600">{p.code || '—'}</td>
                <td className="py-3 text-gray-600">{p.contactPhone || '—'}</td>
                <td className="py-3 text-gray-600">{p.contactEmail || '—'}</td>
                <td className="py-3">
                  <button
                    onClick={() => onToggle(p)}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(p)} className="text-gray-400 hover:text-blue-600" title="Editar">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="text-gray-400 hover:text-red-600" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {providers.map(p => (
          <div key={p.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{p.name}</h4>
                {p.code && <p className="text-xs text-gray-500">Codigo: {p.code}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {p.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {p.contactPhone && <p className="text-sm text-gray-600">{p.contactPhone}</p>}
            {p.contactEmail && <p className="text-sm text-gray-600">{p.contactEmail}</p>}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button onClick={() => onToggle(p)} className="text-xs text-gray-600 hover:text-blue-600">
                {p.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => onEdit(p)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
              <button onClick={() => onDelete(p.id)} className="text-xs text-red-600 hover:text-red-800">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProvidersDirectory({ providers }: { providers: InsuranceProvider[] }) {
  const activeProviders = providers.filter(p => p.isActive);

  if (activeProviders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay aseguradoras activas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeProviders.map(p => (
        <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{p.name}</h4>
              {p.code && <p className="text-xs text-gray-500">{p.code}</p>}
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            {p.contactPhone && (
              <p className="flex items-center gap-2">
                <span className="text-gray-400">Tel:</span> {p.contactPhone}
              </p>
            )}
            {p.contactEmail && (
              <p className="flex items-center gap-2">
                <span className="text-gray-400">Email:</span> {p.contactEmail}
              </p>
            )}
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                {new URL(p.website).hostname}
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Registrada: {new Date(p.createdAt).toLocaleDateString('es-DO')}
          </p>
        </div>
      ))}
    </div>
  );
}
