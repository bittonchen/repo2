import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Payment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('charge/:invoiceId')
  charge(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
    @Body()
    body: {
      cardNumber?: string;
      expMonth?: string;
      expYear?: string;
      cvv?: string;
      holderId?: string;
    },
  ) {
    return this.paymentService.chargeInvoice(tenantId, invoiceId, body);
  }

  @Get('page/:invoiceId')
  getPaymentPage(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.paymentService.getPaymentPageUrl(tenantId, invoiceId).then((url) => ({ url }));
  }
}
