import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly senderName: string;

  constructor(private config: ConfigService) {
    this.provider = this.config.get<string>('SMS_PROVIDER', 'inforumobile');
    this.apiKey = this.config.get<string>('SMS_API_KEY', '');
    this.senderName = this.config.get<string>('SMS_SENDER_NAME', 'VetFlow');
  }

  async send(to: string, body: string): Promise<boolean> {
    this.logger.log(`Sending SMS via ${this.provider} to ${to}`);

    // TODO: Replace with actual SMS provider integration
    // -------------------------------------------------
    //
    // === InforUMobile ===
    // if (this.provider === 'inforumobile') {
    //   const response = await fetch('https://api.inforumobile.com/v2/sms/send', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${this.apiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       message: body,
    //       recipients: [{ phone: to }],
    //       sender: this.senderName,
    //     }),
    //   });
    //   return response.ok;
    // }
    //
    // === 019 SMS ===
    // if (this.provider === '019') {
    //   const response = await fetch('https://api.019sms.co.il/api/v2/sms', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${this.apiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       text: body,
    //       to,
    //       from: this.senderName,
    //     }),
    //   });
    //   return response.ok;
    // }

    this.logger.log(`[STUB] SMS sent successfully to ${to} via ${this.provider}`);
    return true;
  }
}
