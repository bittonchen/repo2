import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 'ביקורת שגרתית' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
