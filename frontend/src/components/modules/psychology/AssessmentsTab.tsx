import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Props {
  patientId: string;
}

export default function AssessmentsTab({ patientId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluaciones</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-gray-500">
          Modulo de evaluaciones psicologicas para el paciente {patientId}.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Proximamente: Instrumentos de evaluacion psicologica, escalas y resultados.
        </p>
      </CardContent>
    </Card>
  );
}
