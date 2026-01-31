import React, { createContext, useContext } from 'react';
import { createContextualCan } from '@casl/react';
import { Ability, AbilityBuilder } from '@casl/ability';

// Define actions and subjects (matching backend)
export const Action = {
    Manage: 'manage',
    Create: 'create',
    Read: 'read',
    Update: 'update',
    Delete: 'delete',
} as const;

export type ActionType = typeof Action[keyof typeof Action];

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
    | 'Notification'
    | 'Odontogram'
    | 'all';

export type AppAbility = Ability<[ActionType, Subjects]>;

const AbilityContext = createContext<AppAbility>(new Ability());

export const Can = createContextualCan(AbilityContext.Consumer);

export const createAbilityFor = (user: {
    id: string;
    role: string;
    tenantId?: string;
    permissions?: any;
}): AppAbility => {
    const { can, build } = new AbilityBuilder<AppAbility>(Ability);

    // SUPER_ADMIN: Full access
    if (user.role === 'SUPER_ADMIN') {
        can(Action.Manage, 'all');
        return build();
    }

    // DENTIST: Full tenant access
    if (user.role === 'DENTIST') {
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

    // PATIENT: Limited access
    if (user.role === 'PATIENT') {
        can(Action.Read, 'Appointment');
        can(Action.Read, 'TreatmentPlan');
        can(Action.Read, 'Invoice');
        can(Action.Read, 'Document');
        can(Action.Read, 'Odontogram');
        can(Action.Read, 'User');
        can(Action.Update, 'User');
        return build();
    }

    // STAFF: Default permissions + custom
    if (
        user.role === 'STAFF_RECEPTIONIST' ||
        user.role === 'STAFF_ASSISTANT' ||
        user.role === 'STAFF_BILLING'
    ) {
        can(Action.Read, 'Patient');
        can(Action.Read, 'Appointment');
        can(Action.Create, 'Appointment');
        can(Action.Update, 'Appointment');
        can(Action.Read, 'Clinic');
        can(Action.Read, 'Operatory');

        // Apply custom permissions
        if (user.permissions && Array.isArray(user.permissions)) {
            user.permissions.forEach((permission: any) => {
                if (permission.action && permission.subject) {
                    can(permission.action, permission.subject);
                }
            });
        }

        return build();
    }

    // Default: No permissions
    return build();
};

export const AbilityProvider: React.FC<{
    user: any;
    children: React.ReactNode;
}> = ({ user, children }) => {
    const ability = user ? createAbilityFor(user) : new Ability<[ActionType, Subjects]>();

    return (
        <AbilityContext.Provider value={ability}>
            {children}
        </AbilityContext.Provider>
    );
};

export const useAbility = () => useContext(AbilityContext);
