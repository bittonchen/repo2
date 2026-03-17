import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderStatus, ReminderType } from '@prisma/client';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: { status?: ReminderStatus; type?: ReminderType; animalId?: string },
  ) {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.animalId) {
      where.animalId = filters.animalId;
    }

    return this.prisma.reminder.findMany({
      where,
      include: {
        animal: {
          include: { client: true },
        },
      },
      orderBy: { sendAt: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, tenantId },
      include: {
        animal: {
          include: { client: true },
        },
      },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    return reminder;
  }

  async create(tenantId: string, dto: CreateReminderDto) {
    return this.prisma.reminder.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        type: dto.type,
        message: dto.message,
        sendAt: new Date(dto.sendAt),
        channel: dto.channel ?? 'sms',
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateReminderDto) {
    await this.findById(tenantId, id);
    const data: any = { ...dto };
    if (dto.sendAt) {
      data.sendAt = new Date(dto.sendAt);
    }
    return this.prisma.reminder.update({ where: { id }, data });
  }

  async cancel(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.cancelled },
    });
  }

  async getPendingReminders() {
    return this.prisma.reminder.findMany({
      where: {
        status: ReminderStatus.pending,
        sendAt: { lte: new Date() },
      },
      include: {
        animal: {
          include: { client: true },
        },
      },
    });
  }

  async markSent(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.sent, sentAt: new Date() },
    });
  }

  async markFailed(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.failed },
    });
  }
}
