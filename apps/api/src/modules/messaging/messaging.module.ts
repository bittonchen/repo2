import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';

@Module({
  imports: [ConfigModule],
  controllers: [MessagingController],
  providers: [MessagingService, EmailService, SmsService, WhatsAppService],
  exports: [MessagingService],
})
export class MessagingModule {}
