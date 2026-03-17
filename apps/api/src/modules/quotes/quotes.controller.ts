import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('quotes')
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.quotesService.findAll(tenantId, { clientId, status });
  }

  @Get(':id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotesService.findById(tenantId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(tenantId, id, dto);
  }

  @Post(':id/accept')
  accept(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotesService.accept(tenantId, id);
  }

  @Post(':id/reject')
  reject(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotesService.reject(tenantId, id);
  }
}
