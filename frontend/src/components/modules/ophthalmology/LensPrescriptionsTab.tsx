import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface LensPrescription {
  id: string;
  prescriptionType: string;
  rightSphere: number | null;
  rightCylinder: number | null;
  rightAxis: number | null;
  rightAdd: number | null;
  rightPd: number | null;
  leftSphere: number | null;
  leftCylinder: number | null;
  leftAxis: number | null;
  leftAdd: number | null;
  leftPd: number | null;
  material: string | null;
  coatings: string[];
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  GLASSES: 'bg-blue-100 text-blue-800',
  CONTACT_LENSES: 'bg-purple-100 text-purple-800',
};

const TYPE_LABELS: Record<string, string> = {
  GLASSES: 'Lentes',
  CONTACT_LENSES: 'Lentes de Contacto',
};

interface Props {
  patientId: string;
}

export default function LensPrescriptionsTab({ patientId }: Props) {
  const [items, setItems] = useState<LensPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LensPrescription | null>(null);
  const [formData, setFormData] = useState({
    prescriptionType: 'GLASSES',
    rightSphere: '', rightCylinder: '', rightAxis: '', rightAdd: '', rightPd: '',
    leftSphere: '', leftCylinder: '', leftAxis: '', leftAdd: '', leftPd: '',
    material: '', coatings: '', expiresAt: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/ophthalmology/lens-prescriptions', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ prescriptionType: 'GLASSES', rightSphere: '', rightCylinder: '', rightAxis: '', rightAdd: '', rightPd: '', leftSphere: '', leftCylinder: '', leftAxis: '', leftAdd: '', leftPd: '', material: '', coatings: '', expiresAt: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: LensPrescription) => {
    setEditing(item);
    setFormData({
      prescriptionType: item.prescriptionType,
      rightSphere: item.rightSphere?.toString() || '', rightCylinder: item.rightCylinder?.toString() || '',
      rightAxis: item.rightAxis?.toString() || '', rightAdd: item.rightAdd?.toString() || '', rightPd: item.rightPd?.toString() || '',
      leftSphere: item.leftSphere?.toString() || '', leftCylinder: item.leftCylinder?.toString() || '',
      leftAxis: item.leftAxis?.toString() || '', leftAdd: item.leftAdd?.toString() || '', leftPd: item.leftPd?.toString() || '',
      material: item.material || '', coatings: item.coatings?.join(', ') || '',
      expiresAt: item.expiresAt ? item.expiresAt.substring(0, 10) : '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const toNum = (v: string) => v ? Number(v) : undefined;
      const payload = {
        prescriptionType: formData.prescriptionType,
        rightSphere: toNum(formData.rightSphere), rightCylinder: toNum(formData.rightCylinder),
        rightAxis: toNum(formData.rightAxis), rightAdd: toNum(formData.rightAdd), rightPd: toNum(formData.rightPd),
        leftSphere: toNum(formData.leftSphere), leftCylinder: toNum(formData.leftCylinder),
        leftAxis: toNum(formData.leftAxis), leftAdd: toNum(formData.leftAdd), leftPd: toNum(formData.leftPd),
        material: formData.material || undefined,
        coatings: formData.coatings ? formData.coatings.split(',').map(s => s.trim()).filter(Boolean) : [],
        expiresAt: formData.expiresAt || undefined, notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/ophthalmology/lens-prescriptions/${editing.id}`, payload);
      } else {
        await api.post('/modules/ophthalmology/lens-prescriptions', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    try { await api.delete(`/modules/ophthalmology/lens-prescriptions/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  const fmtNum = (v: number | null) => v != null ? (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) : '-';
  const fmtAxis = (v: number | null) => v != null ? `${v}°` : '-';
  const fmtPd = (v: number | null) => v != null ? `${v}` : '-';

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando recetas opticas...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recetas Opticas</h3>
        <Button onClick={openCreate}>+ Nueva Receta</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Receta' : 'Nueva Receta Optica'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={formData.prescriptionType} onChange={e => setFormData(p => ({ ...p, prescriptionType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="GLASSES">Lentes</option>
                  <option value="CONTACT_LENSES">Lentes de Contacto</option>
                </select>
              </div>
              {/* OD */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">OD (Ojo Derecho)</p>
                <div className="grid grid-cols-5 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">Esfera</label><input type="number" step="0.25" value={formData.rightSphere} onChange={e => setFormData(p => ({ ...p, rightSphere: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Cilindro</label><input type="number" step="0.25" value={formData.rightCylinder} onChange={e => setFormData(p => ({ ...p, rightCylinder: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Eje</label><input type="number" value={formData.rightAxis} onChange={e => setFormData(p => ({ ...p, rightAxis: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Adicion</label><input type="number" step="0.25" value={formData.rightAdd} onChange={e => setFormData(p => ({ ...p, rightAdd: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">DP</label><input type="number" step="0.5" value={formData.rightPd} onChange={e => setFormData(p => ({ ...p, rightPd: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                </div>
              </div>
              {/* OS */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">OS (Ojo Izquierdo)</p>
                <div className="grid grid-cols-5 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">Esfera</label><input type="number" step="0.25" value={formData.leftSphere} onChange={e => setFormData(p => ({ ...p, leftSphere: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Cilindro</label><input type="number" step="0.25" value={formData.leftCylinder} onChange={e => setFormData(p => ({ ...p, leftCylinder: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Eje</label><input type="number" value={formData.leftAxis} onChange={e => setFormData(p => ({ ...p, leftAxis: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Adicion</label><input type="number" step="0.25" value={formData.leftAdd} onChange={e => setFormData(p => ({ ...p, leftAdd: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">DP</label><input type="number" step="0.5" value={formData.leftPd} onChange={e => setFormData(p => ({ ...p, leftPd: e.target.value }))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Material</label><input type="text" value={formData.material} onChange={e => setFormData(p => ({ ...p, material: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Expiracion</label><input type="date" value={formData.expiresAt} onChange={e => setFormData(p => ({ ...p, expiresAt: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tratamientos (separados por coma)</label><input type="text" value={formData.coatings} onChange={e => setFormData(p => ({ ...p, coatings: e.target.value }))} placeholder="Antirreflejo, Fotocromatico, Blue cut" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notas</label><textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin recetas opticas registradas.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={TYPE_COLORS[item.prescriptionType]}>{TYPE_LABELS[item.prescriptionType] || item.prescriptionType}</Badge>
                    <span className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.expiresAt && (
                      <span className="text-xs text-gray-400">Vence: {new Date(item.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="text-sm h-8">Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)} className="text-sm h-8 text-red-600">Eliminar</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-2 font-medium text-gray-600"></th>
                        <th className="text-center py-1 px-2 font-medium text-gray-600">Esf</th>
                        <th className="text-center py-1 px-2 font-medium text-gray-600">Cil</th>
                        <th className="text-center py-1 px-2 font-medium text-gray-600">Eje</th>
                        <th className="text-center py-1 px-2 font-medium text-gray-600">Add</th>
                        <th className="text-center py-1 px-2 font-medium text-gray-600">DP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-1 px-2 font-medium">OD</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.rightSphere)}</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.rightCylinder)}</td>
                        <td className="py-1 px-2 text-center">{fmtAxis(item.rightAxis)}</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.rightAdd)}</td>
                        <td className="py-1 px-2 text-center">{fmtPd(item.rightPd)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 font-medium">OS</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.leftSphere)}</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.leftCylinder)}</td>
                        <td className="py-1 px-2 text-center">{fmtAxis(item.leftAxis)}</td>
                        <td className="py-1 px-2 text-center">{fmtNum(item.leftAdd)}</td>
                        <td className="py-1 px-2 text-center">{fmtPd(item.leftPd)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {item.material && <p className="text-sm mt-2"><span className="text-gray-500">Material:</span> {item.material}</p>}
                {item.coatings && item.coatings.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {item.coatings.map((c, i) => <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                )}
                {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
