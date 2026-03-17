import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  items: { description: string; quantity: number; unitPrice: number }[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsNumber()
  @IsOptional()
  taxRate?: number;
}
