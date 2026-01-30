import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '../middleware/tenant-context.middleware';

/**
 * Decorator to get the current tenant context from the request
 * Usage: @CurrentTenant() tenant: TenantContext
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext;

    if (!tenantContext) {
      throw new UnauthorizedException('Tenant context not found');
    }

    if (data) {
      return tenantContext[data];
    }

    return tenantContext;
  },
);

/**
 * Decorator to get only the tenant ID
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext;

    if (!tenantContext?.tenantId) {
      throw new UnauthorizedException('Tenant ID not found in context');
    }

    return tenantContext.tenantId;
  },
);
