import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Medical Records')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private medicalRecordsService: MedicalRecordsService) {}

  @Get('vaccinations')
  getVaccinationReport(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.medicalRecordsService.getVaccinationReport(tenantId, status);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('animalId') animalId?: string,
  ) {
    return this.medicalRecordsService.findAll(tenantId, animalId);
  }

  @Get(':id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.medicalRecordsService.findById(tenantId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.medicalRecordsService.remove(tenantId, id);
  }
}
