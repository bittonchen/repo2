import {
  IsBoolean, IsDate, IsEnum, IsNotEmpty,
  IsNumber, IsOptional, IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimalSpecies, AnimalGender } from '@prisma/client';

export class CreateAnimalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: 'רקס' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AnimalSpecies })
  @IsEnum(AnimalSpecies)
  species: AnimalSpecies;

  @ApiPropertyOptional({ example: 'גולדן רטריבר' })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiProperty({ enum: AnimalGender })
  @IsEnum(AnimalGender)
  gender: AnimalGender;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ example: 12.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  microchipNumber?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
