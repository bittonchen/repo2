import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TreatmentTemplatesService } from './treatment-templates.service';
import { CreateTreatmentTemplateDto } from './dto/create-treatment-template.dto';
import { UpdateTreatmentTemplateDto } from './dto/update-treatment-template.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Treatment Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('treatment-templates')
export class TreatmentTemplatesController {
  constructor(private readonly service: TreatmentTemplatesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.findById(tenantId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTreatmentTemplateDto,
  ) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentTemplateDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
