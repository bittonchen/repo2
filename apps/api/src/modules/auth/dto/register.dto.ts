import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'ד"ר ישראל ישראלי' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'israel@clinic.co.il' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '050-1234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'הקליניקה של ישראל' })
  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @ApiProperty({ example: 'israel-clinic' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  clinicSlug: string;
}
