import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAnimalDto } from './create-animal.dto';

export class UpdateAnimalDto extends PartialType(OmitType(CreateAnimalDto, ['clientId'])) {}
