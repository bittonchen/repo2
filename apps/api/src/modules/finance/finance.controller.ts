import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('owner' as any, 'admin' as any)
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('summary')
  getSummary(
    @CurrentTenant() tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getSummary(tenantId, dateFrom, dateTo);
  }

  @Get('revenue-by-month')
  getRevenueByMonth(
    @CurrentTenant() tenantId: string,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.financeService.getRevenueByMonth(tenantId, y);
  }

  @Get('revenue-by-service')
  getRevenueByService(
    @CurrentTenant() tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getRevenueByService(tenantId, dateFrom, dateTo);
  }

  @Get('expenses')
  getExpenses(
    @CurrentTenant() tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getExpensesSummary(tenantId, dateFrom, dateTo);
  }

  @Get('profit-and-loss')
  getProfitAndLoss(
    @CurrentTenant() tenantId: string,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.financeService.getProfitAndLoss(tenantId, y);
  }

  @Get('export')
  getExportData(
    @CurrentTenant() tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getExportData(tenantId, dateFrom, dateTo);
  }
}
