import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderType } from '@prisma/client';

export class CreateReminderDto {
  @ApiPropertyOptional({ example: 'clxyz123...' })
  @IsString()
  @IsOptional()
  animalId?: string;

  @ApiProperty({ enum: ReminderType, example: 'vaccination' })
  @IsEnum(ReminderType)
  @IsNotEmpty()
  type: ReminderType;

  @ApiProperty({ example: 'Vaccination reminder for Buddy' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '2026-04-01T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  sendAt: string;

  @ApiPropertyOptional({ example: 'sms', default: 'sms' })
  @IsString()
  @IsOptional()
  channel?: string = 'sms';
}
