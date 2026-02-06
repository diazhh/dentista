import {
    Ability,
    AbilityBuilder,
    AbilityClass,
    InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Action, Subjects } from './casl-types';

type Subject = InferSubjects<Subjects> | 'all';

export type AppAbility = Ability<[Action, Subject]>;

/**
 * Granular permissions shape stored in TenantMembership.permissions JSON field.
 * Each category maps to specific CASL abilities.
 */
interface GranularPermissions {
    patients?: {
        view?: boolean;
        create?: boolean;
        edit?: boolean;
        delete?: boolean;
    };
    appointments?: {
        view?: boolean;
        create?: boolean;
        edit?: boolean;
        cancel?: boolean;
    };
    billing?: {
        view?: boolean;
        create?: boolean;
    };
    clinical?: {
        viewNotes?: boolean;
        viewDocuments?: boolean;
    };
}

@Injectable()
export class CaslAbilityFactory {
    createForUser(user: {
        id: string;
        role: UserRole;
        tenantId?: string;
        permissions?: any;
    }) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        // SUPER_ADMIN: Full access to everything
        if (user.role === UserRole.SUPER_ADMIN) {
            can(Action.Manage, 'all');
            return build();
        }

        // PROVIDER: Full clinical access within their tenant + staff management
        if (user.role === UserRole.PROVIDER) {
            can(Action.Manage, 'Patient');
            can(Action.Manage, 'Appointment');
            can(Action.Manage, 'TreatmentPlan');
            can(Action.Manage, 'Invoice');
            can(Action.Manage, 'Document');
            can(Action.Manage, 'Odontogram');
            can(Action.Manage, 'Notification');
            can(Action.Manage, 'TenantMembership');
            can(Action.Read, 'Clinic');
            can(Action.Read, 'Operatory');
            can(Action.Manage, 'User');
            can(Action.Read, 'Tenant');
            can(Action.Update, 'Tenant');

            return build();
        }

        // CLINIC_ADMIN: Full access to manage the clinic and its resources
        if (user.role === UserRole.CLINIC_ADMIN) {
            // Clinic management (own clinic via adminUserId check in service layer)
            can(Action.Manage, 'Clinic');
            can(Action.Manage, 'ConsultationRoom');
            can(Action.Manage, 'ClinicStaff');
            can(Action.Manage, 'RoomAssignment');
            can(Action.Manage, 'TenantMembership');
            can(Action.Read, 'Report');

            // Clinical data access (scoped to their clinic in service layer)
            can(Action.Manage, 'Patient');
            can(Action.Manage, 'Appointment');
            can(Action.Manage, 'TreatmentPlan');
            can(Action.Manage, 'Invoice');
            can(Action.Manage, 'Document');
            can(Action.Manage, 'Odontogram');
            can(Action.Manage, 'Notification');
            can(Action.Manage, 'Operatory');
            can(Action.Manage, 'User');
            can(Action.Read, 'Tenant');
            can(Action.Update, 'Tenant');

            return build();
        }

        // STAFF_MANAGER: Can manage scheduling, patients, staff workflows, and sub-staff
        if (user.role === UserRole.STAFF_MANAGER) {
            can(Action.Manage, 'Patient');
            can(Action.Manage, 'Appointment');
            can(Action.Read, 'TreatmentPlan');
            can(Action.Read, 'Invoice');
            can(Action.Read, 'Document');
            can(Action.Read, 'Odontogram');
            can(Action.Manage, 'Notification');
            can(Action.Manage, 'TenantMembership');
            can(Action.Read, 'Clinic');
            can(Action.Read, 'Operatory');
            can(Action.Read, 'User');

            // Apply granular permission overrides from TenantMembership.permissions
            this.applyGranularRestrictions(can, cannot, user.permissions);

            return build();
        }

        // PATIENT: Limited access to own data
        if (user.role === UserRole.PATIENT) {
            can(Action.Read, 'Appointment');
            can(Action.Read, 'TreatmentPlan');
            can(Action.Read, 'Invoice');
            can(Action.Read, 'Document');
            can(Action.Read, 'Odontogram');
            can(Action.Read, 'User');
            can(Action.Update, 'User');

            return build();
        }

        // STAFF_* roles: Granular permissions from TenantMembership.permissions JSON
        if (
            user.role === UserRole.STAFF_RECEPTIONIST ||
            user.role === UserRole.STAFF_ASSISTANT ||
            user.role === UserRole.STAFF_BILLING
        ) {
            const perms = user.permissions as GranularPermissions | null;

            if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
                // -- Patients --
                if (perms.patients?.view) can(Action.Read, 'Patient');
                if (perms.patients?.create) can(Action.Create, 'Patient');
                if (perms.patients?.edit) can(Action.Update, 'Patient');
                if (perms.patients?.delete) can(Action.Delete, 'Patient');

                // -- Appointments --
                if (perms.appointments?.view) can(Action.Read, 'Appointment');
                if (perms.appointments?.create) can(Action.Create, 'Appointment');
                if (perms.appointments?.edit) can(Action.Update, 'Appointment');
                if (perms.appointments?.cancel) can(Action.Delete, 'Appointment');

                // -- Billing --
                if (perms.billing?.view) can(Action.Read, 'Invoice');
                if (perms.billing?.create) can(Action.Create, 'Invoice');

                // -- Clinical --
                if (perms.clinical?.viewNotes) can(Action.Read, 'TreatmentPlan');
                if (perms.clinical?.viewDocuments) can(Action.Read, 'Document');
            } else {
                // Fallback: default staff permissions when no granular permissions are set
                can(Action.Read, 'Patient');
                can(Action.Read, 'Appointment');
                can(Action.Create, 'Appointment');
                can(Action.Update, 'Appointment');
            }

            // All staff can always view clinics and rooms
            can(Action.Read, 'Clinic');
            can(Action.Read, 'Operatory');

            return build();
        }

        // Default: No permissions
        return build();
    }

    /**
     * Apply granular permission restrictions for STAFF_MANAGER.
     * When explicit permissions are set on the membership, they can restrict
     * the default STAFF_MANAGER abilities (e.g., remove billing access).
     */
    private applyGranularRestrictions(
        can: AbilityBuilder<AppAbility>['can'],
        cannot: AbilityBuilder<AppAbility>['cannot'],
        permissions: any,
    ): void {
        if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
            return;
        }

        const perms = permissions as GranularPermissions;

        // If billing permissions are explicitly restricted
        if (perms.billing !== undefined) {
            if (perms.billing.view === false) {
                cannot(Action.Read, 'Invoice');
            }
            if (perms.billing.create === true) {
                can(Action.Create, 'Invoice');
            }
        }

        // If clinical permissions restrict document/notes access
        if (perms.clinical !== undefined) {
            if (perms.clinical.viewNotes === false) {
                cannot(Action.Read, 'TreatmentPlan');
            }
            if (perms.clinical.viewDocuments === false) {
                cannot(Action.Read, 'Document');
            }
        }

        // If patient permissions restrict deletion
        if (perms.patients !== undefined) {
            if (perms.patients.delete === false) {
                cannot(Action.Delete, 'Patient');
            }
        }
    }
}
