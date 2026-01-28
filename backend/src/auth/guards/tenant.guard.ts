import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Super Admin tiene acceso a todo
    if (user.role === 'SUPER_ADMIN') {
      request.tenantContext = {
        userId: user.userId,
        role: user.role,
        isSuperAdmin: true,
      };
      return true;
    }

    const tenantId = user.tenantId;
    
    if (!tenantId) {
      throw new ForbiddenException('No tenant context available');
    }

    // Validar que el tenant existe y está activo
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        subscriptionStatus: true,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    if (tenant.subscriptionStatus === 'CANCELLED') {
      throw new ForbiddenException('Subscription is cancelled');
    }

    // Agregar contexto al request
    request.tenantContext = {
      userId: user.userId,
      tenantId: tenantId,
      role: user.role,
      isSuperAdmin: false,
    };

    return true;
  }
}
