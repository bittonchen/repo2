import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

interface WorkingHoursEntry {
  open?: string;
  close?: string;
  start?: string;
  end?: string;
  closed?: boolean;
}

type WorkingHours = Record<string, WorkingHoursEntry | null>;

const DEFAULT_WORKING_HOURS: WorkingHours = {
  sunday: { open: '08:00', close: '18:00', closed: false },
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '13:00', closed: false },
  saturday: { open: '08:00', close: '18:00', closed: true },
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async getClinicInfo(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Clinic not found');
    }

    const settings = (tenant.settings as any) || {};
    if (settings.bookingEnabled === false) {
      throw new BadRequestException('Online booking is disabled for this clinic');
    }

    return {
      name: tenant.name,
      slug: tenant.slug,
      address: tenant.address,
      phone: tenant.phone,
      logoUrl: tenant.logoUrl,
      workingHours: settings.workingHours || DEFAULT_WORKING_HOURS,
      appointmentDuration: settings.appointmentDuration || 30,
      visitTypes: [
        { key: 'checkup', label: 'בדיקה' },
        { key: 'vaccination', label: 'חיסון' },
        { key: 'surgery', label: 'ניתוח' },
        { key: 'dental', label: 'שיניים' },
        { key: 'emergency', label: 'חירום' },
        { key: 'other', label: 'אחר' },
      ],
    };
  }

  async getVeterinarians(slug: string) {
    const tenant = await this.findTenantBySlug(slug);

    return this.prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        role: 'veterinarian',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailableSlots(slug: string, date: string, veterinarianId: string) {
    const tenant = await this.findTenantBySlug(slug);
    const settings = (tenant.settings as any) || {};
    const workingHours: WorkingHours = settings.workingHours || DEFAULT_WORKING_HOURS;
    const duration: number = settings.appointmentDuration || 30;

    const requestedDate = new Date(date);
    const dayName = DAY_NAMES[requestedDate.getDay()];
    const dayHours = workingHours[dayName];

    if (!dayHours || dayHours.closed === true) {
      return [];
    }

    // Support both open/close and start/end formats
    const openTime = dayHours.open || dayHours.start;
    const closeTime = dayHours.close || dayHours.end;
    if (!openTime || !closeTime) {
      return [];
    }

    // Generate all possible slots
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const slots: string[] = [];
    let cursorMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    while (cursorMinutes + duration <= closeMinutes) {
      const h = Math.floor(cursorMinutes / 60);
      const m = cursorMinutes % 60;

      const slotStart = new Date(requestedDate);
      slotStart.setHours(h, m, 0, 0);

      slots.push(slotStart.toISOString());
      cursorMinutes += duration;
    }

    // Get existing appointments for the day + vet
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        veterinarianId,
        status: { notIn: ['cancelled'] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    // Filter out slots that overlap with existing appointments
    const availableSlots = slots.filter((slotIso) => {
      const slotStart = new Date(slotIso);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      return !existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      });
    });

    // Filter out past slots if date is today
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDay = new Date(requestedDate);
    requestedDay.setHours(0, 0, 0, 0);

    if (requestedDay.getTime() === today.getTime()) {
      return availableSlots.filter((slotIso) => new Date(slotIso) > now);
    }

    return availableSlots;
  }

  async createBooking(slug: string, dto: CreateBookingDto) {
    const tenant = await this.findTenantBySlug(slug);
    const settings = (tenant.settings as any) || {};
    const duration: number = settings.appointmentDuration || 30;

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Check slot is still available (race condition prevention)
    const overlap = await this.prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        veterinarianId: dto.veterinarianId,
        status: { notIn: ['cancelled'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException('This time slot is no longer available');
    }

    // Transaction: find-or-create client, find-or-create animal, create appointment
    return this.prisma.$transaction(async (tx) => {
      // Find or create client by phone
      let client = await tx.client.findFirst({
        where: { tenantId: tenant.id, phone: dto.phone },
      });

      if (!client) {
        client = await tx.client.create({
          data: {
            tenantId: tenant.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email || undefined,
            idNumber: '',
          },
        });
      }

      // Find or create animal by name + clientId
      let animal = await tx.animal.findFirst({
        where: { tenantId: tenant.id, clientId: client.id, name: dto.animalName },
      });

      if (!animal) {
        animal = await tx.animal.create({
          data: {
            tenantId: tenant.id,
            clientId: client.id,
            name: dto.animalName,
            species: (dto.species as any) || 'dog',
            gender: (dto.gender as any) || 'unknown',
            breed: dto.breed || undefined,
          },
        });
      }

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          tenantId: tenant.id,
          clientId: client.id,
          animalId: animal.id,
          veterinarianId: dto.veterinarianId,
          startTime,
          endTime,
          type: dto.type,
          status: 'pending',
        },
        include: {
          veterinarian: { select: { id: true, name: true } },
        },
      });

      return {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        type: appointment.type,
        status: appointment.status,
        veterinarian: appointment.veterinarian,
        clientName: `${dto.firstName} ${dto.lastName}`,
        animalName: dto.animalName,
        clinicName: tenant.name,
        clinicAddress: tenant.address,
        clinicPhone: tenant.phone,
      };
    });
  }

  private async findTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Clinic not found');
    }
    const settings = (tenant.settings as any) || {};
    if (settings.bookingEnabled === false) {
      throw new BadRequestException('Online booking is disabled for this clinic');
    }
    return tenant;
  }
}
