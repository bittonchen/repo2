import { Injectable, Logger } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private remindersService: RemindersService) {}

  /**
   * Process all pending reminders that are due.
   * Call this method periodically (e.g., via a cron job, setInterval, or an admin endpoint).
   *
   * TODO: Integrate with MessagingService to actually send SMS/email/WhatsApp
   * once that module is available. For now, this just marks reminders as sent.
   */
  async processReminders(): Promise<{ processed: number; failed: number }> {
    const pending = await this.remindersService.getPendingReminders();
    let processed = 0;
    let failed = 0;

    for (const reminder of pending) {
      try {
        // TODO: Send actual message via MessagingService based on reminder.channel
        // e.g., await this.messagingService.send({
        //   channel: reminder.channel,
        //   recipient: reminder.animal?.client?.phone,
        //   message: reminder.message,
        // });

        this.logger.log(
          `Processing reminder ${reminder.id} (${reminder.type}) via ${reminder.channel}`,
        );

        await this.remindersService.markSent(reminder.id);
        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to process reminder ${reminder.id}: ${error.message}`,
        );
        await this.remindersService.markFailed(reminder.id);
        failed++;
      }
    }

    this.logger.log(`Reminders processed: ${processed}, failed: ${failed}`);
    return { processed, failed };
  }
}
