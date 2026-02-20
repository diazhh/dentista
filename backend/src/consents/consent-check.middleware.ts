import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConsentsService, ConsentAccessResult } from './consents.service';

/**
 * Middleware that checks if the requesting provider has consent to access patient data.
 *
 * Usage: Apply to routes that include a `:patientId` or `:id` route parameter
 * referring to a patient. The middleware reads the providerId from the JWT
 * (req.user.userId) and the patientId from route params, then calls
 * ConsentsService.checkProviderAccess to determine the access level.
 *
 * The result is injected into `req.consentAccess` for downstream services to use.
 *
 * Example in a module:
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(ConsentCheckMiddleware)
 *       .forRoutes({ path: 'patients/:id', method: RequestMethod.ALL });
 *   }
 */

// Extend Express Request to include consentAccess
declare global {
  namespace Express {
    interface Request {
      consentAccess?: ConsentAccessResult;
    }
  }
}

@Injectable()
export class ConsentCheckMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ConsentCheckMiddleware.name);

  constructor(private readonly consentsService: ConsentsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Only apply consent checks for provider-role users
    if (!user || user.role === 'PATIENT' || user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Extract patientId from route params (supports :id and :patientId)
    const patientId = req.params.id || req.params.patientId;
    if (!patientId) {
      return next();
    }

    const providerId = user.userId;

    try {
      const access = await this.consentsService.checkProviderAccess(
        providerId,
        patientId,
      );

      // Inject the access result into the request object
      req.consentAccess = access;
    } catch (error) {
      this.logger.warn(`Consent check failed for provider=${providerId} patient=${patientId}: ${error.message}`);
      // If consent check fails, default to minimal access
      req.consentAccess = {
        hasConsent: false,
        dataAccessLevel: 'MINIMAL' as any,
        shareAppointments: false,
        shareMedicalHistory: false,
        shareDocuments: false,
        shareLabResults: false,
        shareBilling: false,
      };
    }

    next();
  }
}
