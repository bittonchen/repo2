import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: {
      clientId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.issuedAt = {};
      if (filters.dateFrom) where.issuedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.issuedAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(tenantId: string, dto: CreateInvoiceDto) {
    const taxRate = dto.taxRate ?? 0.17;
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const invoiceNumber = await this.getNextInvoiceNumber(tenantId);

    return this.prisma.$transaction(async (tx) => {
      // Decrement inventory for items with inventoryItemId
      for (const item of dto.items) {
        if (item.inventoryItemId) {
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: { id: item.inventoryItemId, tenantId },
          });
          if (!inventoryItem) {
            throw new BadRequestException(
              `Inventory item ${item.inventoryItemId} not found`,
            );
          }
          if (inventoryItem.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${inventoryItem.name}`,
            );
          }
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { quantity: { decrement: Math.round(item.quantity) } },
          });
        }
      }

      return tx.invoice.create({
        data: {
          tenantId,
          clientId: dto.clientId,
          invoiceNumber,
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              inventoryItemId: item.inventoryItemId,
            })),
          },
        },
        include: {
          client: true,
          items: true,
        },
      });
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    await this.findById(tenantId, id);
    return this.prisma.invoice.update({
      where: { id },
      data: dto,
      include: { client: true, items: true },
    });
  }

  async markPaid(tenantId: string, id: string, paymentMethod: PaymentMethod) {
    const invoice = await this.findById(tenantId, id);
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAmount: invoice.total,
        paymentMethod,
      },
      include: { client: true, items: true },
    });
  }

  async cancel(tenantId: string, id: string) {
    const invoice = await this.findById(tenantId, id);

    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restore inventory quantities
      for (const item of invoice.items) {
        if (item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { quantity: { increment: Math.round(item.quantity) } },
          });
        }
      }

      return tx.invoice.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { client: true, items: true },
      });
    });
  }

  async getClientPayments(tenantId: string, clientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, clientId },
      include: {
        client: true,
        items: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalUnpaid = invoices.reduce(
      (sum, inv) => sum + (inv.total - inv.paidAmount),
      0,
    );

    return {
      invoices,
      summary: {
        totalPaid,
        totalUnpaid,
        invoiceCount: invoices.length,
      },
    };
  }

  async getNextInvoiceNumber(tenantId: string): Promise<string> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice) {
      return 'INV-0001';
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `INV-${nextNumber}`;
  }
}
