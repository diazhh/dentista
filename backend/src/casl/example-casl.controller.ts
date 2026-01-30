import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/casl-types';

/**
 * Example controller demonstrating CASL permissions
 * 
 * Usage in any controller:
 * 1. Add @UseGuards(JwtAuthGuard, PoliciesGuard)
 * 2. Add @CheckPolicies((ability) => ability.can(Action.Read, 'Patient'))
 */
@Controller('examples')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ExampleCaslController {

    @Get('patients')
    @CheckPolicies((ability) => ability.can(Action.Read, 'Patient'))
    getPatients() {
        return { message: 'User has permission to read patients' };
    }

    @Get('invoices')
    @CheckPolicies((ability) => ability.can(Action.Read, 'Invoice'))
    getInvoices() {
        return { message: 'User has permission to read invoices' };
    }

    @Get('admin')
    @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
    adminEndpoint() {
        return { message: 'User is super admin' };
    }
}
