import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabTestDto, AddLabResultsDto, WebhookLabResultDto } from './dto/create-lab-test.dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters: {
    animalId?: string;
    status?: string;
    testType?: string;
  } = {}) {
    const where: any = { tenantId };
    if (filters.animalId) where.animalId = filters.animalId;
    if (filters.status) where.status = filters.status;
    if (filters.testType) where.testType = filters.testType;

    return this.prisma.labTest.findMany({
      where,
      include: {
        animal: { select: { id: true, name: true, species: true } },
        veterinarian: { select: { id: true, name: true } },
        results: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { orderedAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const test = await this.prisma.labTest.findFirst({
      where: { id, tenantId },
      include: {
        animal: {
          select: { id: true, name: true, species: true, breed: true, client: { select: { firstName: true, lastName: true } } },
        },
        veterinarian: { select: { id: true, name: true } },
        results: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!test) throw new NotFoundException('Lab test not found');
    return test;
  }

  async create(tenantId: string, dto: CreateLabTestDto) {
    const { results, ...testData } = dto;

    const labTestId = await this.prisma.$transaction(async (tx) => {
      const labTest = await tx.labTest.create({
        data: {
          ...testData,
          tenantId,
          status: results && results.length > 0 ? 'completed' : 'pending',
          completedAt: results && results.length > 0 ? new Date() : undefined,
        },
      });

      if (results && results.length > 0) {
        await tx.labTestResult.createMany({
          data: results.map((r, i) => ({
            labTestId: labTest.id,
            paramName: r.paramName,
            value: r.value,
            unit: r.unit,
            refMin: r.refMin,
            refMax: r.refMax,
            flag: r.flag || this.calculateFlag(r.value, r.refMin, r.refMax),
            sortOrder: i,
          })),
        });
      }

      return labTest.id;
    });

    return this.findById(tenantId, labTestId);
  }

  async addResults(tenantId: string, id: string, dto: AddLabResultsDto) {
    const test = await this.findById(tenantId, id);
    if (test.status === 'cancelled') {
      throw new BadRequestException('Cannot add results to a cancelled test');
    }

    const maxOrder = test.results.length > 0
      ? Math.max(...test.results.map(r => r.sortOrder))
      : -1;

    await this.prisma.$transaction(async (tx) => {
      await tx.labTestResult.createMany({
        data: dto.results.map((r, i) => ({
          labTestId: id,
          paramName: r.paramName,
          value: r.value,
          unit: r.unit,
          refMin: r.refMin,
          refMax: r.refMax,
          flag: r.flag || this.calculateFlag(r.value, r.refMin, r.refMax),
          sortOrder: maxOrder + 1 + i,
        })),
      });

      await tx.labTest.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
      });
    });

    return this.findById(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    await this.findById(tenantId, id);
    return this.prisma.labTest.update({
      where: { id },
      data: {
        status: status as any,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.labTest.delete({ where: { id } });
  }

  async handleWebhook(tenantId: string, dto: WebhookLabResultDto) {
    const test = await this.findById(tenantId, dto.labTestId);

    const maxOrder = test.results.length > 0
      ? Math.max(...test.results.map(r => r.sortOrder))
      : -1;

    await this.prisma.$transaction(async (tx) => {
      await tx.labTestResult.createMany({
        data: dto.results.map((r, i) => ({
          labTestId: dto.labTestId,
          paramName: r.paramName,
          value: r.value,
          unit: r.unit,
          refMin: r.refMin,
          refMax: r.refMax,
          flag: r.flag || this.calculateFlag(r.value, r.refMin, r.refMax),
          sortOrder: maxOrder + 1 + i,
        })),
      });

      await tx.labTest.update({
        where: { id: dto.labTestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          deviceId: dto.deviceId,
          rawData: dto.rawData || undefined,
        },
      });
    });

    return this.findById(tenantId, dto.labTestId);
  }

  // Get all lab results for an animal parameter over time (for trends)
  async getParameterTrend(tenantId: string, animalId: string, paramName: string) {
    const results = await this.prisma.labTestResult.findMany({
      where: {
        paramName,
        labTest: {
          tenantId,
          animalId,
          status: 'completed',
        },
      },
      include: {
        labTest: { select: { orderedAt: true } },
      },
      orderBy: { labTest: { orderedAt: 'asc' } },
    });

    return results.map((r) => ({
      date: r.labTest.orderedAt,
      value: r.value,
      unit: r.unit,
      refMin: r.refMin,
      refMax: r.refMax,
      flag: r.flag,
    }));
  }

  private calculateFlag(value: string, refMin?: number, refMax?: number): string {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || (refMin == null && refMax == null)) return 'N';
    if (refMin != null && numVal < refMin) return 'L';
    if (refMax != null && numVal > refMax) return 'H';
    return 'N';
  }
}
