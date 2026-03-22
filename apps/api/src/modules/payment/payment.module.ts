import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TranzilaProvider } from './providers/tranzila.provider';
import { CardcomProvider } from './providers/cardcom.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, TranzilaProvider, CardcomProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
