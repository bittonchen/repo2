import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId?: string;
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
