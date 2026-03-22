import {
  IsDate, IsEnum, IsNotEmpty, IsNumber,
  IsOptional, IsString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryCategory } from '@prisma/client';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'אמוקסיצילין 250mg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: InventoryCategory })
  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;
}
