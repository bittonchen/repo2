import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { MessagingService } from '../messaging/messaging.service';
import { MessageChannel } from '../messaging/dto/send-message.dto';

@Injectable()
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private remindersService: RemindersService,
    private messagingService: MessagingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processReminders(): Promise<{ processed: number; failed: number }> {
    const pending = await this.remindersService.getPendingReminders();

    if (pending.length === 0) return { processed: 0, failed: 0 };

    this.logger.log(`Processing ${pending.length} pending reminders`);

    let processed = 0;
    let failed = 0;

    for (const reminder of pending) {
      try {
        const client = reminder.animal?.client;
        if (!client) {
          this.logger.warn(`Reminder ${reminder.id}: no client found, skipping`);
          await this.remindersService.markFailed(reminder.id);
          failed++;
          continue;
        }

        const channel = this.mapChannel(reminder.channel);
        const recipient = this.getRecipient(channel, client);

        if (!recipient) {
          this.logger.warn(`Reminder ${reminder.id}: no recipient for channel ${reminder.channel}`);
          await this.remindersService.markFailed(reminder.id);
          failed++;
          continue;
        }

        await this.messagingService.send(reminder.tenantId, {
          channel,
          recipient,
          subject: channel === MessageChannel.EMAIL ? `תזכורת - ${reminder.type}` : undefined,
          body: reminder.message,
        });

        await this.remindersService.markSent(reminder.id);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process reminder ${reminder.id}: ${error.message}`);
        await this.remindersService.markFailed(reminder.id);
        failed++;
      }
    }

    this.logger.log(`Reminders processed: ${processed}, failed: ${failed}`);
    return { processed, failed };
  }

  private mapChannel(channel: string): MessageChannel {
    switch (channel) {
      case 'email': return MessageChannel.EMAIL;
      case 'whatsapp': return MessageChannel.WHATSAPP;
      case 'sms':
      default:
        return MessageChannel.SMS;
    }
  }

  private getRecipient(
    channel: MessageChannel,
    client: { phone: string; email?: string | null },
  ): string | null {
    switch (channel) {
      case MessageChannel.EMAIL:
        return client.email || null;
      case MessageChannel.SMS:
      case MessageChannel.WHATSAPP:
        return client.phone || null;
    }
  }
}
