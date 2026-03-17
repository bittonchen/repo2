import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters: {
    veterinarianId?: string;
    date?: string;
    status?: AppointmentStatus;
  } = {}) {
    const where: any = { tenantId };

    if (filters.veterinarianId) where.veterinarianId = filters.veterinarianId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      where.startTime = { gte: start, lt: end };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
        animal: true,
        veterinarian: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        animal: true,
        veterinarian: { select: { id: true, name: true } },
        medicalRecord: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(tenantId: string, dto: CreateAppointmentDto) {
    // Check for overlapping appointments
    const overlap = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        veterinarianId: dto.veterinarianId,
        status: { notIn: ['cancelled'] },
        OR: [
          { startTime: { lt: new Date(dto.endTime) }, endTime: { gt: new Date(dto.startTime) } },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException('Veterinarian has an overlapping appointment');
    }

    return this.prisma.appointment.create({
      data: { ...dto, tenantId, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime) },
      include: { client: true, animal: true, veterinarian: { select: { id: true, name: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    await this.findById(tenantId, id);
    const data: any = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);
    return this.prisma.appointment.update({ where: { id }, data });
  }

  async updateStatus(tenantId: string, id: string, status: AppointmentStatus) {
    await this.findById(tenantId, id);
    return this.prisma.appointment.update({ where: { id }, data: { status } });
  }
}
