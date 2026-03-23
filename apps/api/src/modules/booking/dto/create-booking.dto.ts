import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'בדיקה' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: '2024-03-25T10:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiProperty({ example: 'ישראל' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'ישראלי' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '050-1234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'client@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'רקס' })
  @IsString()
  @IsNotEmpty()
  animalName: string;

  @ApiProperty({ example: 'dog' })
  @IsString()
  @IsNotEmpty()
  species: string;

  @ApiPropertyOptional({ example: 'גולדן רטריבר' })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({ example: 'male' })
  @IsString()
  @IsOptional()
  gender?: string;
}
