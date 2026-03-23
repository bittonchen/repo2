import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ImagingService } from './imaging.service';
import { CreateDicomStudyDto, UpdateStudyReportDto } from './dto/create-study.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Imaging')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('imaging')
export class ImagingController {
  constructor(private imagingService: ImagingService) {}

  @Get('studies')
  findAllStudies(
    @CurrentTenant() tenantId: string,
    @Query('animalId') animalId?: string,
    @Query('modality') modality?: string,
    @Query('status') status?: string,
  ) {
    return this.imagingService.findAllStudies(tenantId, { animalId, modality, status });
  }

  @Get('studies/:id')
  findStudyById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.imagingService.findStudyById(tenantId, id);
  }

  @Get('studies/:id/viewer')
  getViewerUrl(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.imagingService.getViewerUrl(tenantId, id);
  }

  @Get('instances/:instanceId/preview')
  async getInstancePreview(
    @CurrentTenant() tenantId: string,
    @Param('instanceId') instanceId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.imagingService.getInstancePreview(tenantId, instanceId);
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  }

  @Get('pacs/test')
  testPacsConnection(@CurrentTenant() tenantId: string) {
    return this.imagingService.testPacsConnection(tenantId);
  }

  @Post('studies')
  createStudy(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDicomStudyDto,
  ) {
    return this.imagingService.createStudy(tenantId, dto);
  }

  @Post('pacs/sync/:animalId')
  syncFromPacs(
    @CurrentTenant() tenantId: string,
    @Param('animalId') animalId: string,
  ) {
    return this.imagingService.syncFromPacs(tenantId, animalId);
  }

  @Patch('studies/:id')
  updateStudyReport(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStudyReportDto,
  ) {
    return this.imagingService.updateStudyReport(tenantId, id, dto);
  }

  @Delete('studies/:id')
  deleteStudy(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.imagingService.deleteStudy(tenantId, id);
  }
}
