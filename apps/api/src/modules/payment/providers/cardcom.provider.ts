import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, ChargeRequest, ChargeResult } from '../payment.interface';

@Injectable()
export class CardcomProvider implements PaymentProvider {
  private readonly logger = new Logger(CardcomProvider.name);
  private readonly terminalNumber: string;
  private readonly apiName: string;

  constructor(private config: ConfigService) {
    this.terminalNumber = this.config.get<string>('CARDCOM_TERMINAL_NUMBER', '');
    this.apiName = this.config.get<string>('CARDCOM_API_NAME', '');
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    this.logger.log(`Charging ${request.amount} via Cardcom`);

    if (!this.terminalNumber) {
      return { success: false, errorMessage: 'Cardcom terminal not configured' };
    }

    try {
      const response = await fetch(
        'https://secure.cardcom.solutions/api/v11/LowProfile/Create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            TerminalNumber: this.terminalNumber,
            ApiName: this.apiName,
            Amount: request.amount,
            CoinId: 1, // ILS
            CardNumber: request.cardNumber,
            CardValidityMonth: request.expMonth,
            CardValidityYear: request.expYear,
            CVV: request.cvv,
            IdentityNumber: request.holderId,
            InvoiceDescription: request.description,
          }),
        },
      );

      const data = await response.json();

      if (data.ResponseCode === 0) {
        return {
          success: true,
          transactionId: data.InternalDealNumber?.toString(),
          approvalNumber: data.ApprovalNumber,
        };
      }

      return {
        success: false,
        errorMessage: data.Description || `Cardcom error: ${data.ResponseCode}`,
      };
    } catch (error) {
      this.logger.error(`Cardcom charge failed: ${error.message}`);
      return { success: false, errorMessage: error.message };
    }
  }
}
