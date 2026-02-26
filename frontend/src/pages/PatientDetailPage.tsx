import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PatientHeader from '../components/patient/PatientHeader';
import PatientTabsContainer from '../components/patient/PatientTabsContainer';
import api from '../services/api';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  documentId?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  user?: {
    email: string;
  };
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = () => {
    navigate(`/appointments/new?patientId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Paciente no encontrado</CardTitle>
            <CardDescription>No se pudo cargar la información del paciente</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/patients')}>Volver a Pacientes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PatientHeader
        patient={patient}
        onScheduleAppointment={handleScheduleAppointment}
      />
      <PatientTabsContainer patientId={id!} />
    </div>
  );
}
