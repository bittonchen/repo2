import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const now = new Date();

    // Today: start of today to end of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // This week: start of current week (Sunday) to end of week (next Sunday)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // This month: first day of current month to first day of next month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      clientCount,
      animalCount,
      appointmentsToday,
      appointmentsWeek,
      appointmentsMonth,
      employeeCount,
      invoiceCount,
      recentActivity,
      lowStockItems,
      pendingReminders,
      unconfirmedAppointments,
    ] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.animal.count({ where: { tenantId } }),
      this.prisma.appointment.count({
        where: { tenantId, startTime: { gte: todayStart, lt: todayEnd } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, startTime: { gte: weekStart, lt: weekEnd } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, startTime: { gte: monthStart, lt: monthEnd } },
      }),
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.appointment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          animal: { select: { id: true, name: true, species: true } },
          veterinarian: { select: { id: true, name: true } },
        },
      }),
      // Low stock: items where quantity < minQuantity (raw query needed for column comparison)
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, category, quantity, "minQuantity", "unitPrice"
         FROM inventory_items
         WHERE "tenantId" = $1 AND quantity < "minQuantity"`,
        tenantId,
      ),
      this.prisma.reminder.count({
        where: { tenantId, status: 'pending' },
      }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          status: 'pending',
          startTime: { gt: now },
        },
      }),
    ]);

    // Employee performance this month: appointment count and revenue per employee
    const employees = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, role: true },
    });

    const employeePerformance = await Promise.all(
      employees.map(async (employee) => {
        const appointmentCount = await this.prisma.appointment.count({
          where: {
            tenantId,
            veterinarianId: employee.id,
            startTime: { gte: monthStart, lt: monthEnd },
          },
        });

        // Revenue: sum of paid invoice totals for clients seen by this employee this month
        let revenue = 0;
        if (appointmentCount > 0) {
          const vetAppointments = await this.prisma.appointment.findMany({
            where: {
              tenantId,
              veterinarianId: employee.id,
              startTime: { gte: monthStart, lt: monthEnd },
            },
            select: { clientId: true },
          });

          const clientIds = [...new Set(vetAppointments.map((a) => a.clientId))];
          const invoices = await this.prisma.invoice.findMany({
            where: {
              tenantId,
              clientId: { in: clientIds },
              status: 'paid',
              issuedAt: { gte: monthStart, lt: monthEnd },
            },
            select: { total: true },
          });
          revenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
        }

        return {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          appointmentCount,
          revenue,
        };
      }),
    );

    return {
      counts: {
        clients: clientCount,
        animals: animalCount,
        appointmentsToday,
        appointmentsWeek,
        appointmentsMonth,
        employees: employeeCount,
        invoices: invoiceCount,
      },
      recentActivity,
      employeePerformance,
      lowStock: lowStockItems,
      pendingReminders,
      unconfirmedAppointments,
    };
  }

  async getNotifications(tenantId: string) {
    const now = new Date();
    const notifications: Array<{
      type: string;
      title: string;
      message: string;
      createdAt: Date;
    }> = [];

    // Low stock items
    const lowStockItems = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; quantity: number; minQuantity: number; createdAt: Date }>
    >(
      `SELECT id, name, quantity, "minQuantity", "createdAt"
       FROM inventory_items
       WHERE "tenantId" = $1 AND quantity < "minQuantity"`,
      tenantId,
    );

    for (const item of lowStockItems) {
      notifications.push({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${item.name} has ${item.quantity} units remaining (minimum: ${item.minQuantity})`,
        createdAt: item.createdAt,
      });
    }

    // Unconfirmed appointments
    const unconfirmedAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'pending',
        startTime: { gt: now },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        animal: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    for (const appt of unconfirmedAppointments) {
      notifications.push({
        type: 'unconfirmed_appointment',
        title: 'Unconfirmed Appointment',
        message: `Appointment for ${appt.client?.firstName} ${appt.client?.lastName} (${appt.animal?.name}) on ${appt.startTime.toISOString()} is still pending`,
        createdAt: appt.createdAt,
      });
    }

    // Pending reminders
    const pendingReminders = await this.prisma.reminder.findMany({
      where: { tenantId, status: 'pending' },
      include: {
        animal: { select: { name: true } },
      },
      orderBy: { sendAt: 'asc' },
    });

    for (const reminder of pendingReminders) {
      notifications.push({
        type: 'pending_reminder',
        title: 'Pending Reminder',
        message: `Reminder for ${reminder.animal?.name ?? 'unknown'}: "${reminder.message}" scheduled for ${reminder.sendAt.toISOString()}`,
        createdAt: reminder.createdAt,
      });
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return notifications;
  }

  async getClinicStats(tenantId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      newClientsThisMonth,
      newClientsLastMonth,
      newAnimalsThisMonth,
      newAnimalsLastMonth,
      revenueThisMonthInvoices,
      revenueLastMonthInvoices,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { tenantId, createdAt: { gte: thisMonthStart, lt: thisMonthEnd } },
      }),
      this.prisma.client.count({
        where: { tenantId, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      this.prisma.animal.count({
        where: { tenantId, createdAt: { gte: thisMonthStart, lt: thisMonthEnd } },
      }),
      this.prisma.animal.count({
        where: { tenantId, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'paid',
          issuedAt: { gte: thisMonthStart, lt: thisMonthEnd },
        },
        select: { total: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'paid',
          issuedAt: { gte: lastMonthStart, lt: lastMonthEnd },
        },
        select: { total: true },
      }),
    ]);

    const revenueThisMonth = revenueThisMonthInvoices.reduce(
      (sum, inv) => sum + inv.total,
      0,
    );
    const revenueLastMonth = revenueLastMonthInvoices.reduce(
      (sum, inv) => sum + inv.total,
      0,
    );

    return {
      newClientsThisMonth,
      newClientsLastMonth,
      newAnimalsThisMonth,
      newAnimalsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
    };
  }
}
