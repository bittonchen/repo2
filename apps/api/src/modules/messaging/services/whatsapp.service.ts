import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private config: ConfigService) {
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  }

  async send(to: string, body: string): Promise<boolean> {
    this.logger.log(`Sending WhatsApp message to ${to}`);

    // TODO: Replace with actual Meta Cloud API integration
    // ----------------------------------------------------
    // const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to,
    //     type: 'text',
    //     text: { body },
    //   }),
    // });
    // const data = await response.json();
    // return !!data.messages?.[0]?.id;

    this.logger.log(`[STUB] WhatsApp message sent successfully to ${to}`);
    return true;
  }
}
