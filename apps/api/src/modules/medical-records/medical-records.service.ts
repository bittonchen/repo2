import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, animalId?: string) {
    const where: any = { tenantId };
    if (animalId) where.animalId = animalId;

    return this.prisma.medicalRecord.findMany({
      where,
      include: {
        animal: true,
        veterinarian: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, tenantId },
      include: {
        animal: { include: { client: true } },
        veterinarian: { select: { id: true, name: true } },
        appointment: true,
      },
    });
    if (!record) throw new NotFoundException('Medical record not found');
    return record;
  }

  async create(tenantId: string, dto: CreateMedicalRecordDto) {
    return this.prisma.medicalRecord.create({
      data: { ...dto, tenantId },
      include: {
        animal: true,
        veterinarian: { select: { id: true, name: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateMedicalRecordDto) {
    await this.findById(tenantId, id);
    return this.prisma.medicalRecord.update({
      where: { id },
      data: dto,
      include: {
        animal: true,
        veterinarian: { select: { id: true, name: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.medicalRecord.delete({ where: { id } });
  }

  async getVaccinationReport(tenantId: string, status?: string) {
    const animals = await this.prisma.animal.findMany({
      where: { tenantId },
      include: {
        client: true,
        medicalRecords: {
          where: {
            tenantId,
            OR: [
              { treatment: { contains: 'חיסון' } },
              { treatment: { contains: 'vaccination', mode: 'insensitive' } },
              { diagnosis: { contains: 'חיסון' } },
              { diagnosis: { contains: 'vaccination', mode: 'insensitive' } },
            ],
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const results = animals.map((animal) => {
      const lastVaccination = animal.medicalRecords[0] || null;
      const lastVaccinationDate = lastVaccination?.date || null;

      let nextDueDate: Date | null = null;
      if (lastVaccinationDate) {
        nextDueDate = new Date(lastVaccinationDate);
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }

      let vaccinationStatus: string;
      if (!nextDueDate) {
        vaccinationStatus = 'overdue';
      } else if (nextDueDate < now) {
        vaccinationStatus = 'overdue';
      } else if (nextDueDate <= thirtyDaysFromNow) {
        vaccinationStatus = 'upcoming';
      } else {
        vaccinationStatus = 'completed';
      }

      return {
        animalId: animal.id,
        animalName: animal.name,
        species: animal.species,
        clientName: `${animal.client.firstName} ${animal.client.lastName}`,
        lastVaccinationDate,
        nextDueDate,
        status: vaccinationStatus,
      };
    });

    if (status) {
      return results.filter((r) => r.status === status);
    }

    return results;
  }
}
