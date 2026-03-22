import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreatmentTemplateDto } from './dto/create-treatment-template.dto';
import { UpdateTreatmentTemplateDto } from './dto/update-treatment-template.dto';

@Injectable()
export class TreatmentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.treatmentTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const template = await this.prisma.treatmentTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Treatment template not found');
    }
    return template;
  }

  async create(tenantId: string, dto: CreateTreatmentTemplateDto) {
    return this.prisma.treatmentTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        items: (dto.items ?? []) as any,
        duration: dto.duration ?? 30,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTreatmentTemplateDto) {
    await this.findById(tenantId, id);
    return this.prisma.treatmentTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.items !== undefined && { items: dto.items as any }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.treatmentTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
