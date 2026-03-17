import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class UpdateInvoiceDto {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;
}
