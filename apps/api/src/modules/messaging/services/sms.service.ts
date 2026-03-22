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

    if (!this.apiKey) {
      this.logger.warn('SMS_API_KEY not configured, skipping send');
      return false;
    }

    try {
      if (this.provider === 'inforumobile') {
        return await this.sendViaInforUMobile(to, body);
      }

      if (this.provider === '019') {
        return await this.sendVia019(to, body);
      }

      this.logger.error(`Unknown SMS provider: ${this.provider}`);
      return false;
    } catch (error) {
      this.logger.error(`SMS to ${to} failed: ${error.message}`);
      return false;
    }
  }

  private async sendViaInforUMobile(to: string, body: string): Promise<boolean> {
    const response = await fetch('https://api.inforumobile.com/v2/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body,
        recipients: [{ phone: to }],
        sender: this.senderName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      this.logger.error(`InforUMobile error: ${response.status} - ${errorText}`);
    }

    return response.ok;
  }

  private async sendVia019(to: string, body: string): Promise<boolean> {
    const response = await fetch('https://api.019sms.co.il/api/v2/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: body,
        to,
        from: this.senderName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      this.logger.error(`019 SMS error: ${response.status} - ${errorText}`);
    }

    return response.ok;
  }
}
