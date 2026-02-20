import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Props {
  patientId: string;
}

export default function SessionsTab({ patientId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesiones</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-gray-500">
          Modulo de sesiones psicologicas para el paciente {patientId}.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Proximamente: Registro de sesiones terapeuticas, notas de progreso y objetivos.
        </p>
      </CardContent>
    </Card>
  );
}
