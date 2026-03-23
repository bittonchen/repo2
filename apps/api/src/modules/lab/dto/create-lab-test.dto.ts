import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LabTestResultDto {
  @ApiProperty({ example: 'WBC' })
  @IsString()
  @IsNotEmpty()
  paramName: string;

  @ApiProperty({ example: '12.5' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: '10^3/uL' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  refMin?: number;

  @ApiPropertyOptional({ example: 16.9 })
  @IsOptional()
  refMax?: number;

  @ApiPropertyOptional({ example: 'N' })
  @IsString()
  @IsOptional()
  flag?: string;
}

export class CreateLabTestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  medicalRecordId?: string;

  @ApiProperty({ example: 'hematology' })
  @IsString()
  @IsNotEmpty()
  testType: string;

  @ApiPropertyOptional({ example: 'CBC' })
  @IsString()
  @IsOptional()
  panelName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [LabTestResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestResultDto)
  @IsOptional()
  results?: LabTestResultDto[];
}

export class AddLabResultsDto {
  @ApiProperty({ type: [LabTestResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestResultDto)
  results: LabTestResultDto[];
}

export class WebhookLabResultDto {
  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Lab test ID to attach results to' })
  @IsString()
  @IsNotEmpty()
  labTestId: string;

  @ApiProperty({ type: [LabTestResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestResultDto)
  results: LabTestResultDto[];

  @ApiPropertyOptional({ description: 'Raw device payload' })
  @IsOptional()
  rawData?: any;
}
