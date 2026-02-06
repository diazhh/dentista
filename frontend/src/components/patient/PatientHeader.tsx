import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  CalendarPlus,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

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
  user?: {
    email: string;
  };
}

interface PatientHeaderProps {
  patient: Patient;
  onScheduleAppointment?: () => void;
  onSendMessage?: () => void;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function PatientHeader({ patient, onScheduleAppointment, onSendMessage }: PatientHeaderProps) {
  const navigate = useNavigate();
  const email = patient.email || patient.user?.email;
  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
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
                  {patient.documentId && <span>{patient.documentId} · </span>}
                  {calculateAge(patient.dateOfBirth)} a&ntilde;os · {patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Femenino' : patient.gender}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/patients/${patient.id}/edit`)}
              >
                <Edit className="mr-1.5 h-4 w-4" />
                Editar
              </Button>
              {onScheduleAppointment && (
                <Button size="sm" onClick={onScheduleAppointment}>
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Agendar Cita</span>
                  <span className="sm:hidden">Cita</span>
                </Button>
              )}
              {onSendMessage && (
                <Button variant="outline" size="sm" onClick={onSendMessage}>
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Mensaje</span>
                </Button>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4 text-xs sm:text-sm text-gray-600">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center hover:text-blue-600 transition-colors">
                <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            )}
            <a href={`tel:${patient.phone}`} className="flex items-center hover:text-blue-600 transition-colors">
              <Phone className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              {patient.phone}
            </a>
            <div className="flex items-center">
              <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
            </div>
          </div>

          {/* Medical alerts */}
          {(hasAllergies || patient.bloodType) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {patient.bloodType && (
                <Badge variant="outline" className="text-xs">
                  {patient.bloodType}
                </Badge>
              )}
              {hasAllergies && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Alergias: {patient.allergies!.join(', ')}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
