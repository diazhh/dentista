import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Props {
  patientId: string;
}

export default function PrescriptionsTab({ patientId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recetas</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-gray-500">
          Modulo de recetas medicas para el paciente {patientId}.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Proximamente: Crear y gestionar prescripciones medicas con catalogo de medicamentos.
        </p>
      </CardContent>
    </Card>
  );
}
