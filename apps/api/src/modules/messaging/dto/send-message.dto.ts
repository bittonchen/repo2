import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export class SendMessageDto {
  @ApiProperty({ enum: MessageChannel, example: MessageChannel.SMS })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiProperty({ example: '050-1234567' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ example: 'תזכורת לתור' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'שלום, תזכורת לתור מחר בשעה 10:00' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Client ID to associate message with' })
  @IsString()
  @IsOptional()
  clientId?: string;
}
