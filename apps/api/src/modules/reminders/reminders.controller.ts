import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { ReminderStatus, ReminderType } from '@prisma/client';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reminders')
export class RemindersController {
  constructor(
    private remindersService: RemindersService,
    private remindersProcessor: RemindersProcessor,
  ) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: ReminderStatus,
    @Query('type') type?: ReminderType,
    @Query('animalId') animalId?: string,
  ) {
    return this.remindersService.findAll(tenantId, { status, type, animalId });
  }

  @Get(':id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.remindersService.findById(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.update(tenantId, id, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.remindersService.cancel(tenantId, id);
  }

  @Post('process')
  processReminders() {
    return this.remindersProcessor.processReminders();
  }
}
