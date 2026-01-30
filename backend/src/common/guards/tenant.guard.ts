import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const TENANT_KEY = 'requireTenant';

/**
 * Guard that ensures the user has access to the requested tenant
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireTenant = this.reflector.getAllAndOverride<boolean>(TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If tenant is not required, allow access
    if (requireTenant === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Super admins have access to all tenants
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const tenantContext = request.tenantContext;

    if (!tenantContext?.tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Check if user has membership to the requested tenant
    const memberships = user.memberships || [];
    const hasTenantAccess = memberships.some(
      (m: any) => m.tenantId === tenantContext.tenantId && m.isActive,
    );

    // Also check if the user's primary tenantId matches
    if (!hasTenantAccess && user.tenantId !== tenantContext.tenantId) {
      throw new ForbiddenException('Access to this tenant is denied');
    }

    return true;
  }
}
