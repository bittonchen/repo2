import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PosService } from '../pos/pos.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private posService: PosService,
  ) {}

  async findAll(
    tenantId: string,
    filters?: {
      clientId?: string;
      status?: string;
    },
  ) {
    const where: any = { tenantId };

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.quote.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { client: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async create(tenantId: string, dto: CreateQuoteDto) {
    const taxRate = dto.taxRate ?? 0.17;
    const items = dto.items;
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const quoteNumber = await this.getNextQuoteNumber(tenantId);

    return this.prisma.quote.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        quoteNumber,
        items: JSON.parse(JSON.stringify(items)),
        subtotal,
        taxRate,
        taxAmount,
        total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes,
      },
      include: { client: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateQuoteDto) {
    await this.findById(tenantId, id);

    const data: any = {};

    if (dto.status) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.validUntil !== undefined) {
      data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }

    if (dto.items) {
      const taxRate = dto.taxRate ?? 0.17;
      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      data.items = JSON.parse(JSON.stringify(dto.items));
      data.subtotal = subtotal;
      data.taxRate = taxRate;
      data.taxAmount = taxAmount;
      data.total = total;
    }

    return this.prisma.quote.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  async accept(tenantId: string, id: string) {
    const quote = await this.findById(tenantId, id);
    const items = quote.items as any[];

    // Update quote status
    await this.prisma.quote.update({
      where: { id },
      data: { status: 'accepted' },
    });

    // Create an invoice from the quote
    const invoice = await this.posService.create(tenantId, {
      clientId: quote.clientId,
      items: items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: quote.notes ?? undefined,
      taxRate: quote.taxRate,
    });

    return { quote: { ...quote, status: 'accepted' }, invoice };
  }

  async reject(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.quote.update({
      where: { id },
      data: { status: 'rejected' },
      include: { client: true },
    });
  }

  private async getNextQuoteNumber(tenantId: string): Promise<string> {
    const lastQuote = await this.prisma.quote.findFirst({
      where: { tenantId },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });

    if (!lastQuote) {
      return 'QUO-0001';
    }

    const lastNumber = parseInt(lastQuote.quoteNumber.replace('QUO-', ''), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `QUO-${nextNumber}`;
  }
}
