import { useState } from 'react';

interface Tooth {
  id?: string;
  toothNumber: number;
  condition: string;
  surfaces: string[];
  notes?: string;
  color?: string;
}

interface OdontogramChartProps {
  teeth: Tooth[];
  onToothClick?: (toothNumber: number) => void;
  editable?: boolean;
}

const TOOTH_CONDITIONS = {
  HEALTHY: { color: '#10b981', label: 'Sano' },
  CAVITY: { color: '#ef4444', label: 'Caries' },
  FILLED: { color: '#3b82f6', label: 'Obturado' },
  CROWN: { color: '#f59e0b', label: 'Corona' },
  BRIDGE: { color: '#8b5cf6', label: 'Puente' },
  IMPLANT: { color: '#6366f1', label: 'Implante' },
  MISSING: { color: '#6b7280', label: 'Ausente' },
  EXTRACTION_NEEDED: { color: '#dc2626', label: 'Extracción' },
  ROOT_CANAL: { color: '#ec4899', label: 'Endodoncia' },
  FRACTURED: { color: '#f97316', label: 'Fracturado' },
  WORN: { color: '#a3a3a3', label: 'Desgastado' },
  ABSCESS: { color: '#991b1b', label: 'Absceso' },
};

export default function OdontogramChart({ teeth, onToothClick, editable = false }: OdontogramChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  // Numeración dental FDI (adultos)
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]; // Cuadrante 1
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]; // Cuadrante 2
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]; // Cuadrante 3
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]; // Cuadrante 4

  const getToothData = (toothNumber: number): Tooth | undefined => {
    return teeth.find(t => t.toothNumber === toothNumber);
  };

  const getToothColor = (toothNumber: number): string => {
    const tooth = getToothData(toothNumber);
    if (!tooth) return '#e5e7eb'; // Gris claro por defecto
    
    if (tooth.color) return tooth.color;
    
    const conditionData = TOOTH_CONDITIONS[tooth.condition as keyof typeof TOOTH_CONDITIONS];
    return conditionData?.color || '#e5e7eb';
  };

  const getToothLabel = (toothNumber: number): string => {
    const tooth = getToothData(toothNumber);
    if (!tooth) return '';
    
    const conditionData = TOOTH_CONDITIONS[tooth.condition as keyof typeof TOOTH_CONDITIONS];
    return conditionData?.label || tooth.condition;
  };

  const renderTooth = (toothNumber: number) => {
    const tooth = getToothData(toothNumber);
    const color = getToothColor(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const hasSurfaces = tooth && tooth.surfaces && tooth.surfaces.length > 0;

    return (
      <div
        key={toothNumber}
        className="relative flex flex-col items-center"
        onMouseEnter={() => setHoveredTooth(toothNumber)}
        onMouseLeave={() => setHoveredTooth(null)}
      >
        {/* Número del diente */}
        <div className="text-xs font-medium text-gray-600 mb-1">
          {toothNumber}
        </div>
        
        {/* Representación del diente */}
        <div
          className={`w-10 h-12 rounded-lg border-2 transition-all ${
            editable ? 'cursor-pointer hover:scale-110' : ''
          } ${isHovered ? 'border-blue-500 shadow-lg' : 'border-gray-300'}`}
          style={{ backgroundColor: color }}
          onClick={() => editable && onToothClick && onToothClick(toothNumber)}
        >
          {/* Indicador de superficies afectadas */}
          {hasSurfaces && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
          )}
        </div>

        {/* Tooltip con información */}
        {isHovered && tooth && (
          <div className="absolute z-10 top-full mt-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            <div className="font-semibold">{getToothLabel(toothNumber)}</div>
            {hasSurfaces && (
              <div className="text-gray-300">
                Superficies: {tooth.surfaces.join(', ')}
              </div>
            )}
            {tooth.notes && (
              <div className="text-gray-300 max-w-xs truncate">
                {tooth.notes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Arcada Superior */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 text-center">
          Arcada Superior
        </div>
        <div className="flex justify-center gap-8">
          {/* Cuadrante 1 - Superior Derecho */}
          <div className="flex gap-1">
            {upperRight.map(renderTooth)}
          </div>
          
          {/* Línea central */}
          <div className="w-px bg-gray-400" />
          
          {/* Cuadrante 2 - Superior Izquierdo */}
          <div className="flex gap-1">
            {upperLeft.map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Línea horizontal de separación */}
      <div className="border-t-2 border-gray-300" />

      {/* Arcada Inferior */}
      <div className="space-y-2">
        <div className="flex justify-center gap-8">
          {/* Cuadrante 4 - Inferior Derecho */}
          <div className="flex gap-1">
            {lowerRight.map(renderTooth)}
          </div>
          
          {/* Línea central */}
          <div className="w-px bg-gray-400" />
          
          {/* Cuadrante 3 - Inferior Izquierdo */}
          <div className="flex gap-1">
            {lowerLeft.map(renderTooth)}
          </div>
        </div>
        <div className="text-sm font-medium text-gray-700 text-center">
          Arcada Inferior
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Leyenda:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.entries(TOOTH_CONDITIONS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: value.color }}
              />
              <span className="text-xs text-gray-600">{value.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
