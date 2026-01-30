import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantContext {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  memberships?: Array<{
    tenantId: string;
    role: string;
  }>;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant context from the authenticated user
    const user = req.user as any;

    if (user) {
      req.tenantContext = {
        tenantId: user.tenantId || null,
        userId: user.userId || user.sub || user.id || null,
        role: user.role || null,
        memberships: user.memberships || [],
      };
    } else {
      req.tenantContext = {
        tenantId: null,
        userId: null,
        role: null,
        memberships: [],
      };
    }

    next();
  }
}
