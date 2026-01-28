export class AppointmentProcedureDto {
  id: string;
  name: string;
  code?: string;
  tooth?: string;
  cost: number;
  notes?: string;
}

export class AppointmentPrescriptionDto {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export class AppointmentClinicalNotesDto {
  diagnosis?: string;
  observations?: string;
  symptoms?: string;
  recommendations?: string;
  notes?: string;
}

export class AppointmentFinancialDto {
  totalCost: number;
  paidAmount: number;
  pendingBalance: number;
  invoiceId?: string;
  invoiceNumber?: string;
}

export class AppointmentMediaDto {
  id: string;
  type: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}

export class AppointmentRelatedRecordsDto {
  treatmentPlanId?: string;
  treatmentPlanTitle?: string;
  odontogramId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  nextAppointmentId?: string;
  nextAppointmentDate?: string;
}

export class AppointmentDetailDto {
  appointment: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    actualDuration?: number;
    status: string;
    type: string;
    operatory?: {
      id: string;
      name: string;
      clinic?: {
        name: string;
        address: string;
      };
    };
    dentist: {
      id: string;
      name: string;
    };
  };
  procedures: AppointmentProcedureDto[];
  prescriptions: AppointmentPrescriptionDto[];
  clinicalNotes: AppointmentClinicalNotesDto;
  financial: AppointmentFinancialDto;
  media: AppointmentMediaDto[];
  relatedRecords: AppointmentRelatedRecordsDto;
}
