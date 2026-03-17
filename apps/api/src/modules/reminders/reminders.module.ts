import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';

@Module({
  imports: [PrismaModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule {}
