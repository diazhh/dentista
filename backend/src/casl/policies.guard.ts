import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory, AppAbility } from './casl-ability.factory';
import {
    CHECK_POLICIES_KEY,
    PolicyHandler,
} from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private caslAbilityFactory: CaslAbilityFactory,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers =
            this.reflector.get<PolicyHandler[]>(
                CHECK_POLICIES_KEY,
                context.getHandler(),
            ) || [];

        if (policyHandlers.length === 0) {
            return true; // No policies to check
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        const ability = this.caslAbilityFactory.createForUser(user);

        const allowed = policyHandlers.every((handler) =>
            this.execPolicyHandler(handler, ability),
        );

        if (!allowed) {
            throw new ForbiddenException(
                'You do not have permission to perform this action',
            );
        }

        return true;
    }

    private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
        if (typeof handler === 'function') {
            return handler(ability);
        }
        return handler.handle(ability);
    }
}
