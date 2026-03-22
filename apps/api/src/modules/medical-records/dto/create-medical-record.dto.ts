import {
  IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  treatment?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  prescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 12.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 38.5 })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}
