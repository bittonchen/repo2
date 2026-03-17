import {
  Controller, Get, Post,
  Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('messaging')
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Post('send')
  send(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.send(tenantId, dto);
  }

  @Get('log')
  getLog(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.messagingService.getLog(tenantId, clientId);
  }
}
