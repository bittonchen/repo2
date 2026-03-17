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
import { PosService } from './pos.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { PaymentMethod } from '@prisma/client';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Get('invoices')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.posService.findAll(tenantId, {
      clientId,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get('invoices/:id')
  findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.posService.findById(tenantId, id);
  }

  @Post('invoices')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.posService.create(tenantId, dto);
  }

  @Patch('invoices/:id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.posService.update(tenantId, id, dto);
  }

  @Post('invoices/:id/pay')
  markPaid(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: PaymentMethod,
  ) {
    return this.posService.markPaid(tenantId, id, paymentMethod);
  }

  @Post('invoices/:id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.posService.cancel(tenantId, id);
  }
}
