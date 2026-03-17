import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Animals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('animals')
export class AnimalsController {
  constructor(private animalsService: AnimalsService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.animalsService.findAll(tenantId, clientId);
  }

  @Get(':id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.animalsService.findById(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateAnimalDto) {
    return this.animalsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.animalsService.remove(tenantId, id);
  }
}
