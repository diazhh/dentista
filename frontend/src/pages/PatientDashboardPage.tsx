import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react';
import PatientSummaryTab from '../components/dashboard/PatientSummaryTab';
import PatientAppointmentsTab from '../components/dashboard/PatientAppointmentsTab';
import PatientTreatmentsTab from '../components/dashboard/PatientTreatmentsTab';
import PatientOdontogramsTab from '../components/dashboard/PatientOdontogramsTab';
import PatientInvoicesTab from '../components/dashboard/PatientInvoicesTab';
import PatientPaymentsTab from '../components/dashboard/PatientPaymentsTab';
import PatientDocumentsTab from '../components/dashboard/PatientDocumentsTab';
import PatientMedicalHistoryTab from '../components/dashboard/PatientMedicalHistoryTab';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

export default function PatientDashboardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Pacientes
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {calculateAge(patient.dateOfBirth)} años • {patient.gender === 'MALE' ? 'Masculino' : 'Femenino'}
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                {patient.email || 'No registrado'}
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                {patient.phone}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="odontograms">Odontogramas</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="medical">Historia Médica</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <PatientSummaryTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="appointments">
          <PatientAppointmentsTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="treatments">
          <PatientTreatmentsTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="odontograms">
          <PatientOdontogramsTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="invoices">
          <PatientInvoicesTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="payments">
          <PatientPaymentsTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="documents">
          <PatientDocumentsTab patientId={patientId!} />
        </TabsContent>

        <TabsContent value="medical">
          <PatientMedicalHistoryTab patientId={patientId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
