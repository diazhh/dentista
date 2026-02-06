import { Card, CardContent } from '../ui/card';

interface Props {
  patientId: string;
}

export default function PatientMedicalHistoryTab({ patientId }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-gray-500">
          Tab de Historia Médica - En desarrollo
        </p>
      </CardContent>
    </Card>
  );
}
