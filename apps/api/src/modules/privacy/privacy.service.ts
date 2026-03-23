import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PrivacyService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async exportClientData(clientId: string, tenantId: string, userId: string, ip?: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        animals: {
          include: {
            medicalRecords: true,
            appointments: true,
            reminders: true,
            labTests: { include: { results: true } },
            dicomStudies: true,
          },
        },
        appointments: true,
        invoices: { include: { items: true } },
        quotes: true,
        messageLogs: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'EXPORT',
      entity: 'Client',
      entityId: clientId,
      details: { type: 'data_export' },
      ip,
    });

    return client;
  }

  async eraseClientData(clientId: string, tenantId: string, userId: string, ip?: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Anonymize PII instead of hard delete — preserves referential integrity for medical/financial records
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        firstName: '[DELETED]',
        lastName: '[DELETED]',
        phone: '[DELETED]',
        email: null,
        address: null,
        idNumber: '[DELETED]',
        dateOfBirth: null,
        notes: null,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'ERASE',
      entity: 'Client',
      entityId: clientId,
      details: { type: 'data_erasure', originalName: `${client.firstName} ${client.lastName}` },
      ip,
    });

    return { message: 'Client data erased successfully' };
  }
}
