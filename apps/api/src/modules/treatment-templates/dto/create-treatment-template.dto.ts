import {
  IsString, IsNotEmpty, IsOptional, IsArray,
  IsInt, ValidateNested, IsNumber, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TreatmentTemplateItemDto {
  @ApiProperty({ example: 'Consultation fee' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 150.0 })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export class CreateTreatmentTemplateDto {
  @ApiProperty({ example: 'Annual Vaccination' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Standard annual vaccination package' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'vaccination' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ type: [TreatmentTemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentTemplateItemDto)
  @IsOptional()
  items?: TreatmentTemplateItemDto[];

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;
}
