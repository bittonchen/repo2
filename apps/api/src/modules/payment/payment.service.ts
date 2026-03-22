import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProvider, ChargeRequest, ChargeResult } from './payment.interface';
import { TranzilaProvider } from './providers/tranzila.provider';
import { CardcomProvider } from './providers/cardcom.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly provider: PaymentProvider;
  private readonly providerName: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private tranzilaProvider: TranzilaProvider,
    private cardcomProvider: CardcomProvider,
  ) {
    this.providerName = this.config.get<string>('PAYMENT_PROVIDER', 'tranzila');
    this.provider =
      this.providerName === 'cardcom' ? this.cardcomProvider : this.tranzilaProvider;
  }

  async chargeInvoice(
    tenantId: string,
    invoiceId: string,
    chargeData: Partial<ChargeRequest>,
  ): Promise<ChargeResult> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice already paid');
    }

    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is cancelled');
    }

    const result = await this.provider.charge({
      ...chargeData,
      amount: invoice.total - invoice.paidAmount,
      invoiceId,
      description: `VetFlow Invoice ${invoice.invoiceNumber}`,
    });

    if (result.success) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAmount: invoice.total,
          paymentMethod: 'credit_card',
        },
      });
      this.logger.log(`Invoice ${invoice.invoiceNumber} paid via ${this.providerName}`);
    }

    return result;
  }

  async getPaymentPageUrl(tenantId: string, invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    if (!this.provider.getPaymentPageUrl) {
      throw new BadRequestException('Payment page not supported by current provider');
    }

    const amount = invoice.total - invoice.paidAmount;
    return this.provider.getPaymentPageUrl(amount, invoiceId);
  }
}
