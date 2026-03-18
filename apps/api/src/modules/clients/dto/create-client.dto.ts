import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
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

  @ApiProperty({ example: '012345678' })
  @IsString()
  @IsNotEmpty()
  idNumber: string;

  @ApiPropertyOptional({ example: 'israel@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'רחוב הרצל 1, תל אביב' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
