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

@Injectable()
export class CaslAbilityFactory {
    createForUser(user: {
        id: string;
        role: UserRole;
        tenantId?: string;
        permissions?: any;
    }) {
        const { can, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        // SUPER_ADMIN: Full access to everything
        if (user.role === UserRole.SUPER_ADMIN) {
            can(Action.Manage, 'all');
            return build();
        }

        // DENTIST: Full access within their tenant
        if (user.role === UserRole.DENTIST) {
            can(Action.Manage, 'Patient');
            can(Action.Manage, 'Appointment');
            can(Action.Manage, 'TreatmentPlan');
            can(Action.Manage, 'Invoice');
            can(Action.Manage, 'Document');
            can(Action.Manage, 'Odontogram');
            can(Action.Manage, 'Notification');
            can(Action.Read, 'Clinic');
            can(Action.Read, 'Operatory');
            can(Action.Manage, 'User');
            can(Action.Read, 'Tenant');
            can(Action.Update, 'Tenant');

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

        // STAFF_* roles: Based on custom permissions
        if (
            user.role === UserRole.STAFF_RECEPTIONIST ||
            user.role === UserRole.STAFF_ASSISTANT ||
            user.role === UserRole.STAFF_BILLING
        ) {
            // Default staff permissions
            can(Action.Read, 'Patient');
            can(Action.Read, 'Appointment');
            can(Action.Create, 'Appointment');
            can(Action.Update, 'Appointment');
            can(Action.Read, 'Clinic');
            can(Action.Read, 'Operatory');

            // Apply custom permissions if they exist
            if (user.permissions && Array.isArray(user.permissions)) {
                user.permissions.forEach((permission: any) => {
                    if (permission.action && permission.subject) {
                        can(permission.action as Action, permission.subject as Subject);
                    }
                });
            }

            return build();
        }

        // Default: No permissions
        return build();
    }
}
