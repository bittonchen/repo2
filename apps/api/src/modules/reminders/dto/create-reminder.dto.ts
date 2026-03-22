import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  sendAt: Date;

  @ApiPropertyOptional({ example: 'sms', default: 'sms' })
  @IsString()
  @IsOptional()
  channel?: string = 'sms';
}
