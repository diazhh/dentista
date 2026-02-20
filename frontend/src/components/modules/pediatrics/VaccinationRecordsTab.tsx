import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface VaccinationRecord {
  id: string;
  vaccineName: string;
  vaccineType: string | null;
  doseNumber: number;
  administeredDate: string;
  nextDoseDate: string | null;
  batchNumber: string | null;
  site: string | null;
  route: string | null;
  manufacturer: string | null;
  adverseReaction: string | null;
  notes: string | null;
  createdAt: string;
}

const ROUTE_LABELS: Record<string, string> = {
  IM: 'Intramuscular',
  SC: 'Subcutanea',
  Oral: 'Oral',
  ID: 'Intradermica',
};

interface Props {
  patientId: string;
}

export default function VaccinationRecordsTab({ patientId }: Props) {
  const [items, setItems] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VaccinationRecord | null>(null);
  const [formData, setFormData] = useState({
    vaccineName: '', vaccineType: '', doseNumber: '1', administeredDate: '', nextDoseDate: '',
    batchNumber: '', site: '', route: 'IM', manufacturer: '', adverseReaction: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/modules/pediatrics/vaccination-records', { params: { patientId } });
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const resetForm = () => {
    setFormData({ vaccineName: '', vaccineType: '', doseNumber: '1', administeredDate: '', nextDoseDate: '', batchNumber: '', site: '', route: 'IM', manufacturer: '', adverseReaction: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: VaccinationRecord) => {
    setEditing(item);
    setFormData({
      vaccineName: item.vaccineName, vaccineType: item.vaccineType || '', doseNumber: item.doseNumber.toString(),
      administeredDate: item.administeredDate ? item.administeredDate.substring(0, 10) : '',
      nextDoseDate: item.nextDoseDate ? item.nextDoseDate.substring(0, 10) : '',
      batchNumber: item.batchNumber || '', site: item.site || '', route: item.route || 'IM',
      manufacturer: item.manufacturer || '', adverseReaction: item.adverseReaction || '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        vaccineName: formData.vaccineName, vaccineType: formData.vaccineType || undefined,
        doseNumber: Number(formData.doseNumber), administeredDate: formData.administeredDate,
        nextDoseDate: formData.nextDoseDate || undefined, batchNumber: formData.batchNumber || undefined,
        site: formData.site || undefined, route: formData.route, manufacturer: formData.manufacturer || undefined,
        adverseReaction: formData.adverseReaction || undefined, notes: formData.notes || undefined,
      };
      if (editing) {
        await api.patch(`/modules/pediatrics/vaccination-records/${editing.id}`, payload);
      } else {
        await api.post('/modules/pediatrics/vaccination-records', { ...payload, patientId });
      }
      resetForm();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de vacunacion?')) return;
    try { await api.delete(`/modules/pediatrics/vaccination-records/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div><span className="text-gray-500">Cargando vacunas...</span></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Registros de Vacunacion</h3>
        <Button onClick={openCreate}>+ Nueva Vacuna</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{editing ? 'Editar Vacuna' : 'Registrar Vacuna'}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Vacuna</label><input type="text" value={formData.vaccineName} onChange={e => setFormData(p => ({ ...p, vaccineName: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><input type="text" value={formData.vaccineType} onChange={e => setFormData(p => ({ ...p, vaccineType: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Dosis #</label><input type="number" min="1" value={formData.doseNumber} onChange={e => setFormData(p => ({ ...p, doseNumber: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha Aplicacion</label><input type="date" value={formData.administeredDate} onChange={e => setFormData(p => ({ ...p, administeredDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Proxima Dosis</label><input type="date" value={formData.nextDoseDate} onChange={e => setFormData(p => ({ ...p, nextDoseDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lote</label><input type="text" value={formData.batchNumber} onChange={e => setFormData(p => ({ ...p, batchNumber: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label><input type="text" value={formData.manufacturer} onChange={e => setFormData(p => ({ ...p, manufacturer: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Sitio</label><input type="text" value={formData.site} onChange={e => setFormData(p => ({ ...p, site: e.target.value }))} placeholder="Ej: Brazo izq." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Via</label>
                  <select value={formData.route} onChange={e => setFormData(p => ({ ...p, route: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="IM">Intramuscular</option>
                    <option value="SC">Subcutanea</option>
                    <option value="Oral">Oral</option>
                    <option value="ID">Intradermica</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reaccion Adversa</label><textarea value={formData.adverseReaction} onChange={e => setFormData(p => ({ ...p, adverseReaction: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
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
        <Card><CardContent className="p-6 text-center py-8"><p className="text-gray-500">Sin registros de vacunacion.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Vacuna</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Dosis</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Proxima</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Fabricante</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Via</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Reaccion</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{item.vaccineName}</td>
                      <td className="py-2 px-3 text-center"><Badge variant="secondary">#{item.doseNumber}</Badge></td>
                      <td className="py-2 px-3 text-center">{new Date(item.administeredDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-center">{item.nextDoseDate ? new Date(item.nextDoseDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-3 text-center">{item.manufacturer || '-'}</td>
                      <td className="py-2 px-3 text-center">{ROUTE_LABELS[item.route || ''] || item.route || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {item.adverseReaction ? (
                          <span className="text-red-600" title={item.adverseReaction}>&#9888;</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs">Editar</button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
