import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Edit, Trash2, X, BarChart3 } from 'lucide-react';
import { inventoryAPI } from '../services/api';

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  description: string | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  costPrice: number | null;
  salePrice: number | null;
  supplier: string | null;
  location: string | null;
  expirationDate: string | null;
  isActive: boolean;
}

interface Summary {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  expiringSoon: number;
  byCategory: Record<string, number>;
}

const CATEGORIES = [
  { value: 'MEDICATION', label: 'Medicamentos' },
  { value: 'SUPPLY', label: 'Insumos' },
  { value: 'EQUIPMENT', label: 'Equipos' },
  { value: 'INSTRUMENT', label: 'Instrumentos' },
  { value: 'OTHER', label: 'Otros' },
];

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Entrada', color: 'text-green-600' },
  { value: 'OUT', label: 'Salida', color: 'text-red-600' },
  { value: 'ADJUSTMENT', label: 'Ajuste', color: 'text-blue-600' },
  { value: 'RETURN', label: 'Devolución', color: 'text-yellow-600' },
  { value: 'EXPIRED', label: 'Expirado', color: 'text-gray-600' },
];

const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, summaryData] = await Promise.all([
        inventoryAPI.getAll({ category: categoryFilter || undefined, search: search || undefined, lowStock: lowStockFilter || undefined }),
        inventoryAPI.getSummary(),
      ]);
      setItems(itemsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading inventory', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, lowStockFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este item del inventario?')) return;
    await inventoryAPI.delete(id);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7" /> Inventario Médico
        </h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <Plus className="w-4 h-4" /> Nuevo Item
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Items</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalItems}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> Stock Bajo</div>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">RD${summary.totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Por Expirar (30d)</div>
            <div className="text-2xl font-bold text-red-600">{summary.expiringSoon}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o proveedor..."
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lowStockFilter} onChange={e => setLowStockFilter(e.target.checked)} className="rounded text-indigo-600" />
          Solo stock bajo
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron items.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Mín</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Proveedor</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{categoryLabel(item.category)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${item.currentStock <= item.minimumStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.currentStock}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.minimumStock}</td>
                    <td className="px-4 py-3 text-right">{item.costPrice ? `$${item.costPrice.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{item.supplier || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setShowMovement(item.id)} title="Movimiento" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><BarChart3 className="w-4 h-4" /></button>
                        <button onClick={() => { setEditItem(item); setShowForm(true); }} title="Editar" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} title="Eliminar" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showForm && <ItemFormModal item={editItem} onClose={() => setShowForm(false)} onSave={loadData} />}

      {/* Movement Modal */}
      {showMovement && <MovementModal itemId={showMovement} onClose={() => setShowMovement(null)} onSave={loadData} />}
    </div>
  );
}

function ItemFormModal({ item, onClose, onSave }: { item: InventoryItem | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || 'SUPPLY',
    description: item?.description || '',
    unit: item?.unit || 'unidad',
    currentStock: item?.currentStock || 0,
    minimumStock: item?.minimumStock || 0,
    maximumStock: item?.maximumStock || '',
    costPrice: item?.costPrice || '',
    salePrice: item?.salePrice || '',
    supplier: item?.supplier || '',
    location: item?.location || '',
    expirationDate: item?.expirationDate ? item.expirationDate.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }

    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        sku: form.sku || undefined,
        maximumStock: form.maximumStock ? Number(form.maximumStock) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        expirationDate: form.expirationDate || undefined,
      };

      if (item) {
        await inventoryAPI.update(item.id, data);
      } else {
        await inventoryAPI.create(data);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{item ? 'Editar Item' : 'Nuevo Item'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mx-4 mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
              <input type="number" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: +e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="number" value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: +e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>
              <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
              <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Expiración</label>
              <input type="date" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Guardando...' : item ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementModal({ itemId, onClose, onSave }: { itemId: string; onClose: () => void; onSave: () => void }) {
  const [movements, setMovements] = useState<any[]>([]);
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    inventoryAPI.getMovements(itemId).then(setMovements).catch(console.error);
  }, [itemId]);

  const handleSubmit = async () => {
    if (quantity <= 0) { setError('Cantidad debe ser mayor a 0'); return; }
    setSaving(true);
    setError('');
    try {
      await inventoryAPI.createMovement({ itemId, type, quantity, reason: reason || undefined });
      const updated = await inventoryAPI.getMovements(itemId);
      setMovements(updated);
      setQuantity(1);
      setReason('');
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = (t: string) => MOVEMENT_TYPES.find(m => m.value === t)?.color || 'text-gray-600';
  const typeLabel = (t: string) => MOVEMENT_TYPES.find(m => m.value === t)?.label || t;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Movimientos de Inventario</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 border-b space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Registrar Movimiento</h3>
          {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              {MOVEMENT_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} min={1} className="w-20 px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Razón..." className="flex-1 px-3 py-2 border rounded-md text-sm" />
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? '...' : 'Registrar'}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700">Historial</h3>
          {movements.length === 0 ? (
            <p className="text-sm text-gray-400">Sin movimientos registrados.</p>
          ) : (
            movements.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div className="flex items-center gap-2">
                  {m.type === 'IN' || m.type === 'RETURN' ? <ArrowDownCircle className="w-4 h-4 text-green-500" /> : <ArrowUpCircle className="w-4 h-4 text-red-500" />}
                  <span className={`font-medium ${typeColor(m.type)}`}>{typeLabel(m.type)}</span>
                  <span className="text-gray-500">×{m.quantity}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">{m.previousStock} → {m.newStock}</div>
                  <div className="text-gray-400 text-xs">{new Date(m.createdAt).toLocaleDateString('es-DO')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
