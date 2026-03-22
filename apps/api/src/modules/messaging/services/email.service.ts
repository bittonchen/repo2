import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: SESClient;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    const region = this.config.get<string>('AWS_SES_REGION', 'eu-west-1');
    this.fromEmail = this.config.get<string>('AWS_SES_FROM_EMAIL', 'noreply@vetflow.co.il');

    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`Sending email to ${to} | subject: ${subject}`);

    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: body, Charset: 'UTF-8' } },
        },
      });
      const response = await this.client.send(command);
      const success = response.$metadata.httpStatusCode === 200;
      this.logger.log(`Email to ${to}: ${success ? 'sent' : 'failed'}`);
      return success;
    } catch (error) {
      this.logger.error(`Email to ${to} failed: ${error.message}`);
      return false;
    }
  }
}
