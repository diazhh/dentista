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
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-4 text-sm sm:text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Volver a Pacientes</span>
          <span className="sm:hidden">Volver</span>
        </Button>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-2xl break-words">
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-lg">
                    {calculateAge(patient.dateOfBirth)} años • {patient.gender === 'MALE' ? 'Masculino' : 'Femenino'}
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{patient.email || 'No registrado'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                {patient.phone}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1 sm:gap-2 h-auto p-1">
          <TabsTrigger value="summary" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">Resumen</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">Citas</TabsTrigger>
          <TabsTrigger value="treatments" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
            <span className="hidden sm:inline">Tratamientos</span>
            <span className="sm:hidden">Trat.</span>
          </TabsTrigger>
          <TabsTrigger value="odontograms" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
            <span className="hidden sm:inline">Odontogramas</span>
            <span className="sm:hidden">Odont.</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">Facturas</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">Pagos</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
            <span className="hidden sm:inline">Documentos</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
            <span className="hidden sm:inline">Historia Médica</span>
            <span className="sm:hidden">Médica</span>
          </TabsTrigger>
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
