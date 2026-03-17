import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly region: string;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.region = this.config.get<string>('AWS_SES_REGION', 'eu-west-1');
    this.fromEmail = this.config.get<string>('AWS_SES_FROM_EMAIL', 'noreply@vetflow.co.il');
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`Sending email to ${to} | subject: ${subject}`);
    this.logger.debug(`From: ${this.fromEmail} | Region: ${this.region}`);

    // TODO: Replace with actual AWS SES SDK integration
    // -------------------------------------------------
    // import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
    //
    // const client = new SESClient({ region: this.region });
    // const command = new SendEmailCommand({
    //   Source: this.fromEmail,
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Subject: { Data: subject, Charset: 'UTF-8' },
    //     Body: { Html: { Data: body, Charset: 'UTF-8' } },
    //   },
    // });
    // const response = await client.send(command);
    // return response.$metadata.httpStatusCode === 200;

    this.logger.log(`[STUB] Email sent successfully to ${to}`);
    return true;
  }
}
