import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit state-changing requests
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const path: string = request.route?.path || request.url;
    const action = this.methodToAction(method);
    const entity = this.extractEntity(path);
    const entityId = request.params?.id;

    return next.handle().pipe(
      tap({
        next: () => {
          this.log({
            tenantId: user?.tenantId,
            userId: user?.sub,
            action,
            entity,
            entityId,
            details: {
              method,
              path: request.url,
              body: this.sanitizeBody(request.body),
            },
            ip: request.ip || request.headers['x-forwarded-for'],
            userAgent: request.headers['user-agent'],
          });
        },
        error: () => {
          // Don't log on error — failed operations shouldn't produce audit entries
        },
      }),
    );
  }

  private methodToAction(method: string): string {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PATCH':
      case 'PUT': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return method;
    }
  }

  private extractEntity(path: string): string {
    // Extract entity name from path like /api/clients/:id → Client
    const segments = path.split('/').filter(Boolean);
    // Skip 'api' prefix
    const entitySegment = segments.find((s) => s !== 'api' && !s.startsWith(':'));
    if (!entitySegment) return 'Unknown';
    // Convert plural kebab-case to PascalCase singular
    return entitySegment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
      .replace(/s$/, '');
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    const sanitized = { ...body };
    // Remove sensitive fields from audit log
    const sensitiveFields = ['password', 'passwordHash', 'currentPassword', 'newPassword', 'token', 'refreshToken'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  private log(data: {
    tenantId?: string;
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }) {
    // Fire-and-forget — don't block the response
    this.prisma.auditLog
      .create({ data })
      .catch((err) => console.error('Audit log error:', err));
  }
}
