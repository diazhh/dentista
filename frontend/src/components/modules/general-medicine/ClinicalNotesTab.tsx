import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Props {
  patientId: string;
}

export default function ClinicalNotesTab({ patientId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas Clinicas</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-gray-500">
          Modulo de notas clinicas para el paciente {patientId}.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Proximamente: Registro de notas clinicas SOAP, exploracion fisica y diagnosticos.
        </p>
      </CardContent>
    </Card>
  );
}
