import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteDto {
  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;

  @IsArray()
  @IsOptional()
  items?: { description: string; quantity: number; unitPrice: number }[];

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validUntil?: Date;

  @IsNumber()
  @IsOptional()
  taxRate?: number;
}
