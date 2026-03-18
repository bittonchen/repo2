import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page?: number | string, pageSize?: number | string, search?: string) {
    const p = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(pageSize || 20), 10) || 20);
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { animals: true },
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps) };
  }

  async findById(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        animals: {
          include: {
            medicalRecords: {
              orderBy: { date: 'desc' },
              take: 5,
              include: { veterinarian: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: {
            animal: { select: { name: true } },
            veterinarian: { select: { name: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(tenantId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findById(tenantId, id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.client.delete({ where: { id } });
  }
}
