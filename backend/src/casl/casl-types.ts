export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
}

export type Subjects =
    | 'User'
    | 'Tenant'
    | 'Patient'
    | 'Appointment'
    | 'TreatmentPlan'
    | 'Invoice'
    | 'Document'
    | 'Clinic'
    | 'Operatory'
    | 'ConsultationRoom'
    | 'ClinicStaff'
    | 'RoomAssignment'
    | 'Notification'
    | 'Odontogram'
    | 'TenantMembership'
    | 'Report'
    | 'all';

export type AppAbility = any; // Will be properly typed by CASL
