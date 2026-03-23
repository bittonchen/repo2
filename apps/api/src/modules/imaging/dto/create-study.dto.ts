import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDicomStudyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @ApiProperty({ example: '1.2.840.113619.2.55.3.123456' })
  @IsString()
  @IsNotEmpty()
  studyInstanceUid: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studyDate?: string;

  @ApiPropertyOptional({ example: 'Thorax AP' })
  @IsString()
  @IsOptional()
  studyDescription?: string;

  @ApiProperty({ example: 'DX' })
  @IsString()
  @IsNotEmpty()
  modality: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessionNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referringVet?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orthancStudyId?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  numberOfSeries?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  numberOfInstances?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStudyReportDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportText?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
