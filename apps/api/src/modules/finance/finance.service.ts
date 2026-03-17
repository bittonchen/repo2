import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId };
    if (dateFrom || dateTo) {
      where.issuedAt = {};
      if (dateFrom) where.issuedAt.gte = new Date(dateFrom);
      if (dateTo) where.issuedAt.lte = new Date(dateTo);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { items: true },
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const unpaidAmount = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

    // Top services by revenue
    const serviceMap = new Map<string, number>();
    for (const invoice of invoices.filter((inv) => inv.status === 'paid')) {
      for (const item of invoice.items) {
        const current = serviceMap.get(item.description) || 0;
        serviceMap.set(item.description, current + item.total);
      }
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([description, revenue]) => ({ description, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalRevenue,
      totalInvoices,
      paidInvoices,
      unpaidAmount,
      topServices,
    };
  }

  async getRevenueByMonth(tenantId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'paid',
        issuedAt: { gte: startDate, lt: endDate },
      },
      select: {
        total: true,
        issuedAt: true,
      },
    });

    // Initialize all 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
    }));

    for (const invoice of invoices) {
      const month = invoice.issuedAt.getMonth();
      months[month].revenue += invoice.total;
    }

    return months;
  }

  async getRevenueByService(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = { tenantId, status: 'paid' };
    if (dateFrom || dateTo) {
      where.issuedAt = {};
      if (dateFrom) where.issuedAt.gte = new Date(dateFrom);
      if (dateTo) where.issuedAt.lte = new Date(dateTo);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { items: true },
    });

    const serviceMap = new Map<string, { revenue: number; count: number }>();
    for (const invoice of invoices) {
      for (const item of invoice.items) {
        const current = serviceMap.get(item.description) || {
          revenue: 0,
          count: 0,
        };
        current.revenue += item.total;
        current.count += 1;
        serviceMap.set(item.description, current);
      }
    }

    return Array.from(serviceMap.entries())
      .map(([description, data]) => ({
        description,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
