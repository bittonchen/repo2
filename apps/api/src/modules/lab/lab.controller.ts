import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabService } from './lab.service';
import { CreateLabTestDto, AddLabResultsDto, WebhookLabResultDto } from './dto/create-lab-test.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Lab')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('lab')
export class LabController {
  constructor(private labService: LabService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('animalId') animalId?: string,
    @Query('status') status?: string,
    @Query('testType') testType?: string,
  ) {
    return this.labService.findAll(tenantId, { animalId, status, testType });
  }

  @Get('trend/:animalId/:paramName')
  getParameterTrend(
    @CurrentTenant() tenantId: string,
    @Param('animalId') animalId: string,
    @Param('paramName') paramName: string,
  ) {
    return this.labService.getParameterTrend(tenantId, animalId, paramName);
  }

  @Get(':id')
  findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.labService.findById(tenantId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateLabTestDto,
  ) {
    return this.labService.create(tenantId, dto);
  }

  @Post(':id/results')
  addResults(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddLabResultsDto,
  ) {
    return this.labService.addResults(tenantId, id, dto);
  }

  @Post('webhook')
  handleWebhook(
    @CurrentTenant() tenantId: string,
    @Body() dto: WebhookLabResultDto,
  ) {
    return this.labService.handleWebhook(tenantId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.labService.updateStatus(tenantId, id, status);
  }

  @Delete(':id')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.labService.remove(tenantId, id);
  }
}
