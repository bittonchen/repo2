import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';
import { SendMessageDto, MessageChannel } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsAppService: WhatsAppService,
  ) {}

  async send(
    tenantId: string,
    options: SendMessageDto,
  ) {
    const { channel, recipient, subject, body, clientId } = options;

    let success: boolean;

    switch (channel) {
      case MessageChannel.EMAIL:
        if (!subject) {
          throw new BadRequestException('Subject is required for email messages');
        }
        success = await this.emailService.send(recipient, subject, body);
        break;

      case MessageChannel.SMS:
        success = await this.smsService.send(recipient, body);
        break;

      case MessageChannel.WHATSAPP:
        success = await this.whatsAppService.send(recipient, body);
        break;

      default:
        throw new BadRequestException(`Unsupported channel: ${channel}`);
    }

    const log = await this.prisma.messageLog.create({
      data: {
        tenantId,
        clientId: clientId || null,
        channel,
        recipient,
        subject: subject || null,
        body,
        status: success ? 'sent' : 'failed',
      },
    });

    this.logger.log(`Message ${log.id} via ${channel} to ${recipient}: ${log.status}`);

    return log;
  }

  async getLog(tenantId: string, clientId?: string) {
    const where: any = { tenantId };
    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
