import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  items: { description: string; quantity: number; unitPrice: number }[];

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
