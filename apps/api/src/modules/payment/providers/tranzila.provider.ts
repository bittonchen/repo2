import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, ChargeRequest, ChargeResult } from '../payment.interface';

@Injectable()
export class TranzilaProvider implements PaymentProvider {
  private readonly logger = new Logger(TranzilaProvider.name);
  private readonly terminalName: string;
  private readonly terminalPassword: string;

  constructor(private config: ConfigService) {
    this.terminalName = this.config.get<string>('TRANZILA_TERMINAL_NAME', '');
    this.terminalPassword = this.config.get<string>('TRANZILA_TERMINAL_PASSWORD', '');
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    this.logger.log(`Charging ${request.amount} via Tranzila`);

    if (!this.terminalName) {
      return { success: false, errorMessage: 'Tranzila terminal not configured' };
    }

    try {
      const params = new URLSearchParams({
        supplier: this.terminalName,
        TranzilaPW: this.terminalPassword,
        sum: request.amount.toFixed(2),
        currency: request.currency === 'USD' ? '2' : '1', // 1=ILS, 2=USD
        ccno: request.cardNumber || '',
        expdate: `${request.expMonth}${request.expYear}`,
        mycvv: request.cvv || '',
        myid: request.holderId || '',
        pdesc: request.description || '',
      });

      const response = await fetch(
        `https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        },
      );

      const text = await response.text();
      const result = Object.fromEntries(
        text.split('&').map((pair) => pair.split('=')),
      );

      if (result.Response === '000') {
        return {
          success: true,
          transactionId: result.index,
          approvalNumber: result.ConfirmationCode,
        };
      }

      return {
        success: false,
        errorMessage: `Tranzila error code: ${result.Response}`,
      };
    } catch (error) {
      this.logger.error(`Tranzila charge failed: ${error.message}`);
      return { success: false, errorMessage: error.message };
    }
  }

  async getPaymentPageUrl(amount: number, invoiceId: string): Promise<string> {
    const callbackUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const params = new URLSearchParams({
      supplier: this.terminalName,
      sum: amount.toFixed(2),
      currency: '1',
      cred_type: '1',
      pdesc: `Invoice ${invoiceId}`,
      notify_url_address: `${callbackUrl}/api/payment/webhook/tranzila`,
      success_url_address: `${callbackUrl}/pos?payment=success`,
      fail_url_address: `${callbackUrl}/pos?payment=failed`,
    });

    return `https://direct.tranzila.com/${this.terminalName}/iframenew.php?${params.toString()}`;
  }
}
