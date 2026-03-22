import { Module } from '@nestjs/common';
import { TreatmentTemplatesService } from './treatment-templates.service';
import { TreatmentTemplatesController } from './treatment-templates.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TreatmentTemplatesController],
  providers: [TreatmentTemplatesService],
})
export class TreatmentTemplatesModule {}
