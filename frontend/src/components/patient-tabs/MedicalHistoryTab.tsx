import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Heart, AlertTriangle, Pill, Activity, Phone, User, Droplets } from 'lucide-react';
import api from '../../services/api';

interface PatientMedicalData {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  chronicConditions?: string[];
  medicalHistory?: Record<string, unknown>;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  dateOfBirth?: string;
  gender?: string;
  accessLevel?: string;
  providerLocalData?: {
    providerNotes?: string;
    localMedicalHistory?: Record<string, unknown>;
    localAllergies?: string[];
    localMedications?: string[];
  };
}

interface Props {
  patientId: string;
}

export default function PatientMedicalHistoryTab({ patientId }: Props) {
  const [data, setData] = useState<PatientMedicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: 'Masculino',
      FEMALE: 'Femenino',
      OTHER: 'Otro',
    };
    return labels[gender] || gender;
  };

  const getBloodTypeColor = (type: string) => {
    if (type.includes('-')) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No se pudo cargar la historia médica</p>
        </CardContent>
      </Card>
    );
  }

  const isRestricted = data.accessLevel === 'MINIMAL' || data.accessLevel === 'SCHEDULING_ONLY';

  if (isRestricted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500" />
            <p className="font-medium">Acceso limitado</p>
            <p className="text-sm">
              No tiene permisos suficientes para ver la historia médica de este paciente.
              El nivel de acceso actual es: <Badge variant="outline">{data.accessLevel}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.dateOfBirth && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Edad</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateAge(data.dateOfBirth)} años</div>
              <p className="text-xs text-muted-foreground">
                {new Date(data.dateOfBirth).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        )}

        {data.gender && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Género</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getGenderLabel(data.gender)}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo de Sangre</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.bloodType ? (
              <Badge className={`text-lg px-3 py-1 ${getBloodTypeColor(data.bloodType)}`}>
                {data.bloodType}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">No registrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            Alergias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.allergies && data.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((allergy, i) => (
                <Badge key={i} variant="destructive">{allergy}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin alergias conocidas</p>
          )}
        </CardContent>
      </Card>

      {/* Medications & Chronic Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="mr-2 h-5 w-5 text-blue-500" />
              Medicamentos Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.medications && data.medications.length > 0 ? (
              <div className="space-y-2">
                {data.medications.map((med, i) => (
                  <div key={i} className="flex items-center p-2 bg-blue-50 rounded">
                    <Pill className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{med}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin medicamentos registrados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-orange-500" />
              Condiciones Crónicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.chronicConditions && data.chronicConditions.length > 0 ? (
              <div className="space-y-2">
                {data.chronicConditions.map((condition, i) => (
                  <div key={i} className="flex items-center p-2 bg-orange-50 rounded">
                    <Heart className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{condition}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin condiciones crónicas registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      {(data.emergencyContactName || data.emergencyContactPhone) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-green-500" />
              Contacto de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.emergencyContactName && (
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{data.emergencyContactName}</p>
                </div>
              )}
              {data.emergencyContactRelation && (
                <div>
                  <p className="text-sm text-muted-foreground">Relación</p>
                  <p className="font-medium">{data.emergencyContactRelation}</p>
                </div>
              )}
              {data.emergencyContactPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{data.emergencyContactPhone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Local Data */}
      {data.providerLocalData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-purple-500" />
              Notas del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.providerLocalData.providerNotes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{data.providerLocalData.providerNotes}</p>
              </div>
            )}

            {data.providerLocalData.localAllergies && data.providerLocalData.localAllergies.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Alergias (registro local)</p>
                <div className="flex flex-wrap gap-2">
                  {data.providerLocalData.localAllergies.map((a, i) => (
                    <Badge key={i} variant="outline" className="border-red-300 text-red-700">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.providerLocalData.localMedications && data.providerLocalData.localMedications.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Medicamentos (registro local)</p>
                <div className="flex flex-wrap gap-2">
                  {data.providerLocalData.localMedications.map((m, i) => (
                    <Badge key={i} variant="outline" className="border-blue-300 text-blue-700">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {!data.providerLocalData.providerNotes &&
              (!data.providerLocalData.localAllergies || data.providerLocalData.localAllergies.length === 0) &&
              (!data.providerLocalData.localMedications || data.providerLocalData.localMedications.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin notas locales del proveedor</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
