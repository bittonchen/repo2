import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@Injectable()
export class AnimalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, clientId?: string) {
    const where: any = { tenantId };
    if (clientId) where.clientId = clientId;

    return this.prisma.animal.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        medicalRecords: {
          orderBy: { date: 'desc' },
          include: { veterinarian: { select: { id: true, name: true } } },
        },
        appointments: {
          orderBy: { startTime: 'desc' },
          include: {
            veterinarian: { select: { id: true, name: true } },
          },
        },
        reminders: {
          orderBy: { sendAt: 'desc' },
        },
      },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    return animal;
  }

  async create(tenantId: string, dto: CreateAnimalDto) {
    return this.prisma.animal.create({
      data: { ...dto, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateAnimalDto) {
    await this.findById(tenantId, id);
    return this.prisma.animal.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.animal.delete({ where: { id } });
  }
}
