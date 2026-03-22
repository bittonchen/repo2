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
    const serviceMap = new Map<string, { revenue: number; count: number }>();
    for (const invoice of invoices.filter((inv) => inv.status === 'paid')) {
      for (const item of invoice.items) {
        const current = serviceMap.get(item.description) || { revenue: 0, count: 0 };
        current.revenue += item.total;
        current.count += 1;
        serviceMap.set(item.description, current);
      }
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([description, data]) => ({ description, revenue: data.revenue, count: data.count }))
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

  async getExpensesSummary(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId };
    if (dateFrom || dateTo) {
      where.updatedAt = {};
      if (dateFrom) where.updatedAt.gte = new Date(dateFrom);
      if (dateTo) where.updatedAt.lte = new Date(dateTo);
    }

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where,
      select: {
        name: true,
        category: true,
        costPrice: true,
        quantity: true,
      },
    });

    const totalInventoryCost = inventoryItems.reduce(
      (sum, item) => sum + (item.costPrice || 0) * item.quantity,
      0,
    );

    const byCategory = new Map<string, number>();
    for (const item of inventoryItems) {
      const cat = item.category;
      const current = byCategory.get(cat) || 0;
      byCategory.set(cat, current + (item.costPrice || 0) * item.quantity);
    }

    return {
      totalInventoryCost,
      byCategory: Array.from(byCategory.entries()).map(([category, cost]) => ({
        category,
        cost,
      })),
    };
  }

  async getProfitAndLoss(tenantId: string, year: number) {
    const months = await this.getRevenueByMonth(tenantId, year);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Get inventory cost as proxy for expenses
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
      select: { costPrice: true, quantity: true },
    });
    const totalInventoryCost = inventoryItems.reduce(
      (sum, item) => sum + (item.costPrice || 0) * item.quantity,
      0,
    );

    const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
    const monthlyExpenseEstimate = totalInventoryCost / 12;

    return {
      year,
      totalRevenue,
      totalExpenses: totalInventoryCost,
      netProfit: totalRevenue - totalInventoryCost,
      months: months.map((m) => ({
        ...m,
        expenses: Math.round(monthlyExpenseEstimate * 100) / 100,
        profit: Math.round((m.revenue - monthlyExpenseEstimate) * 100) / 100,
      })),
    };
  }

  async getExportData(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId };
    if (dateFrom || dateTo) {
      where.issuedAt = {};
      if (dateFrom) where.issuedAt.gte = new Date(dateFrom);
      if (dateTo) where.issuedAt.lte = new Date(dateTo);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client ? `${inv.client.firstName} ${inv.client.lastName}` : '',
      status: inv.status,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      paidAmount: inv.paidAmount,
      paymentMethod: inv.paymentMethod || '',
      issuedAt: inv.issuedAt.toISOString().split('T')[0],
      items: inv.items.map((i) => i.description).join(', '),
    }));
  }
}
