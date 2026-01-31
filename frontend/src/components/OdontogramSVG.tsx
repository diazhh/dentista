import { useCallback, useMemo } from 'react';
import { Odontogram } from 'react-odontogram';

// Mapeo de condiciones dentales a colores
const CONDITION_COLORS: Record<string, string> = {
  HEALTHY: '#10b981',      // Verde
  CAVITY: '#ef4444',       // Rojo
  FILLED: '#3b82f6',       // Azul
  CROWN: '#f59e0b',        // Amarillo/Naranja
  BRIDGE: '#8b5cf6',       // Púrpura
  IMPLANT: '#6366f1',      // Indigo
  MISSING: '#6b7280',      // Gris
  EXTRACTION_NEEDED: '#dc2626', // Rojo oscuro
  ROOT_CANAL: '#ec4899',   // Rosa
  FRACTURED: '#f97316',    // Naranja
  WORN: '#a3a3a3',         // Gris claro
  ABSCESS: '#991b1b',      // Rojo muy oscuro
};

const CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Sano',
  CAVITY: 'Caries',
  FILLED: 'Obturado',
  CROWN: 'Corona',
  BRIDGE: 'Puente',
  IMPLANT: 'Implante',
  MISSING: 'Ausente',
  EXTRACTION_NEEDED: 'Extracción',
  ROOT_CANAL: 'Endodoncia',
  FRACTURED: 'Fracturado',
  WORN: 'Desgastado',
  ABSCESS: 'Absceso',
};

const SURFACE_LABELS: Record<string, string> = {
  OCCLUSAL: 'Oclusal (O)',
  MESIAL: 'Mesial (M)',
  DISTAL: 'Distal (D)',
  BUCCAL: 'Bucal (B)',
  LINGUAL: 'Lingual (L)',
  INCISAL: 'Incisal (I)',
};

interface ToothData {
  id?: string;
  toothNumber: number;
  condition: string;
  surfaces: string[];
  notes?: string;
  color?: string;
}

interface OdontogramSVGProps {
  teeth: ToothData[];
  onToothClick?: (toothNumber: number, toothId: string) => void;
  onToothSelect?: (selectedTeeth: string[]) => void;
  editable?: boolean;
  showLegend?: boolean;
  highlightConditions?: string[];
}

// Mapeo de notación FDI a ID de react-odontogram
const FDI_TO_ID: Record<number, string> = {
  // Cuadrante 1 - Superior Derecho
  18: '18', 17: '17', 16: '16', 15: '15', 14: '14', 13: '13', 12: '12', 11: '11',
  // Cuadrante 2 - Superior Izquierdo
  21: '21', 22: '22', 23: '23', 24: '24', 25: '25', 26: '26', 27: '27', 28: '28',
  // Cuadrante 3 - Inferior Izquierdo
  31: '31', 32: '32', 33: '33', 34: '34', 35: '35', 36: '36', 37: '37', 38: '38',
  // Cuadrante 4 - Inferior Derecho
  41: '41', 42: '42', 43: '43', 44: '44', 45: '45', 46: '46', 47: '47', 48: '48',
  // Dentición decidua (temporal) - Cuadrante 5 (Superior Derecho)
  55: '55', 54: '54', 53: '53', 52: '52', 51: '51',
  // Cuadrante 6 (Superior Izquierdo)
  61: '61', 62: '62', 63: '63', 64: '64', 65: '65',
  // Cuadrante 7 (Inferior Izquierdo)
  71: '71', 72: '72', 73: '73', 74: '74', 75: '75',
  // Cuadrante 8 (Inferior Derecho)
  81: '81', 82: '82', 83: '83', 84: '84', 85: '85',
};

export default function OdontogramSVG({
  teeth,
  onToothClick,
  onToothSelect,
  editable = false,
  showLegend = true,
  highlightConditions = [],
}: OdontogramSVGProps) {
  // Convertir los dientes a IDs iniciales seleccionados basados en condición
  const defaultSelectedTeeth = useMemo(() => {
    if (highlightConditions.length === 0) {
      // Si no hay filtro, mostrar todos los dientes con condiciones no saludables
      return teeth
        .filter(t => t.condition !== 'HEALTHY')
        .map(t => FDI_TO_ID[t.toothNumber])
        .filter(Boolean);
    }
    return teeth
      .filter(t => highlightConditions.includes(t.condition))
      .map(t => FDI_TO_ID[t.toothNumber])
      .filter(Boolean);
  }, [teeth, highlightConditions]);

  // Crear un mapa de toothNumber a datos del diente
  const teethMap = useMemo(() => {
    const map = new Map<string, ToothData>();
    teeth.forEach(tooth => {
      const id = FDI_TO_ID[tooth.toothNumber];
      if (id) {
        map.set(id, tooth);
      }
    });
    return map;
  }, [teeth]);

  // Crear colores personalizados basados en condiciones
  const toothColors = useMemo(() => {
    const colors: Record<string, string> = {};
    teeth.forEach(tooth => {
      const id = FDI_TO_ID[tooth.toothNumber];
      if (id) {
        colors[id] = tooth.color || CONDITION_COLORS[tooth.condition] || '#e5e7eb';
      }
    });
    return colors;
  }, [teeth]);

  const handleChange = useCallback((selected: any[]) => {
    const ids = selected.map((t: any) => t.id || t);

    if (onToothSelect) {
      onToothSelect(ids);
    }

    // Si hay un solo diente seleccionado, llamar onToothClick
    if (ids.length === 1 && onToothClick) {
      const toothData = teethMap.get(ids[0]);
      if (toothData) {
        onToothClick(toothData.toothNumber, toothData.id || '');
      }
    }
  }, [onToothSelect, onToothClick, teethMap]);

  const getToothInfo = (toothId: string): ToothData | null => {
    return teethMap.get(toothId) || null;
  };

  // Crear contenido del tooltip
  const tooltipContent = useCallback((payload?: { id: string }) => {
    if (!payload) return null;
    const tooth = getToothInfo(payload.id);
    if (!tooth) return <span>Diente #{payload.id}</span>;

    return (
      <div className="text-xs">
        <div className="font-bold">Diente #{tooth.toothNumber}</div>
        <div style={{ color: CONDITION_COLORS[tooth.condition] }}>
          {CONDITION_LABELS[tooth.condition] || tooth.condition}
        </div>
        {tooth.surfaces.length > 0 && (
          <div className="text-gray-400">
            {tooth.surfaces.map(s => SURFACE_LABELS[s] || s).join(', ')}
          </div>
        )}
      </div>
    );
  }, [teethMap]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = teeth.length;
    const healthy = teeth.filter(t => t.condition === 'HEALTHY').length;
    const withConditions = total - healthy;
    const conditionCounts: Record<string, number> = {};

    teeth.forEach(t => {
      conditionCounts[t.condition] = (conditionCounts[t.condition] || 0) + 1;
    });

    return { total, healthy, withConditions, conditionCounts };
  }, [teeth]);

  return (
    <div className="space-y-6">
      {/* Odontograma SVG */}
      <div className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-center">
          <div className="transform scale-110">
            <Odontogram
              onChange={editable ? handleChange : undefined}
              defaultSelected={defaultSelectedTeeth}
              theme="light"
              colors={toothColors}
              notation="FDI"
              showTooltip={true}
              tooltip={{
                placement: 'top',
                content: tooltipContent,
              }}
              className="odontogram-custom"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-700">Dientes Registrados</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
          <div className="text-sm text-green-700">Sanos</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.withConditions}</div>
          <div className="text-sm text-amber-700">Con Condiciones</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(stats.conditionCounts).length}
          </div>
          <div className="text-sm text-purple-700">Tipos de Condición</div>
        </div>
      </div>

      {/* Leyenda */}
      {showLegend && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Leyenda de Condiciones
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(CONDITION_LABELS).map(([key, label]) => {
              const count = stats.conditionCounts[key] || 0;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    count > 0 ? 'bg-white shadow-sm border border-gray-200' : 'opacity-50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: CONDITION_COLORS[key] }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700 truncate block">{label}</span>
                    {count > 0 && (
                      <span className="text-xs text-gray-500">({count})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estilos personalizados para el odontograma */}
      <style>{`
        .odontogram-custom {
          --tooth-fill: #f8fafc;
          --tooth-stroke: #cbd5e1;
          --tooth-selected-fill: #3b82f6;
          --tooth-selected-stroke: #1d4ed8;
          --tooth-hover-fill: #e0f2fe;
        }

        .odontogram-custom svg {
          max-width: 100%;
          height: auto;
        }

        .odontogram-custom path[data-tooth] {
          transition: all 0.2s ease;
          cursor: ${editable ? 'pointer' : 'default'};
        }

        .odontogram-custom path[data-tooth]:hover {
          filter: brightness(0.95);
          transform-origin: center;
        }

        /* Animación para dientes seleccionados */
        @keyframes pulse-tooth {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .tooth-pulse {
          animation: pulse-tooth 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Componente adicional para el editor de dientes
interface ToothEditorProps {
  toothNumber: number;
  currentCondition: string;
  currentSurfaces: string[];
  currentNotes: string;
  onSave: (data: { condition: string; surfaces: string[]; notes: string }) => void;
  onCancel: () => void;
}

export function ToothEditor({
  toothNumber,
  currentCondition,
  currentSurfaces,
  currentNotes,
  onSave,
  onCancel,
}: ToothEditorProps) {
  const [condition, setCondition] = useState(currentCondition);
  const [surfaces, setSurfaces] = useState<string[]>(currentSurfaces);
  const [notes, setNotes] = useState(currentNotes);

  const toggleSurface = (surface: string) => {
    setSurfaces(prev =>
      prev.includes(surface)
        ? prev.filter(s => s !== surface)
        : [...prev, surface]
    );
  };

  const handleSave = () => {
    onSave({ condition, surfaces, notes });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar Diente #{toothNumber}
      </h3>

      {/* Condición */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condición
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(CONDITION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Superficies */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Superficies Afectadas
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SURFACE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSurface(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                surfaces.includes(key)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Observaciones adicionales..."
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
