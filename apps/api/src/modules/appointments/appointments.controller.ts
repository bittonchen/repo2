import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('veterinarianId') veterinarianId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll(tenantId, { veterinarianId, date, status });
  }

  @Get(':id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.appointmentsService.findById(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(tenantId, id, status);
  }
}
