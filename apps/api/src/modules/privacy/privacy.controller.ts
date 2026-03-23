import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Privacy')
@Controller('privacy')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get('export/:clientId')
  @Roles('owner', 'admin')
  exportClientData(
    @Param('clientId') clientId: string,
    @CurrentUser('sub') userId: string,
    @CurrentTenant() tenantId: string,
    @Req() req: Request,
  ) {
    return this.privacyService.exportClientData(clientId, tenantId, userId, req.ip);
  }

  @Delete('erase/:clientId')
  @Roles('owner', 'admin')
  eraseClientData(
    @Param('clientId') clientId: string,
    @CurrentUser('sub') userId: string,
    @CurrentTenant() tenantId: string,
    @Req() req: Request,
  ) {
    return this.privacyService.eraseClientData(clientId, tenantId, userId, req.ip);
  }
}
