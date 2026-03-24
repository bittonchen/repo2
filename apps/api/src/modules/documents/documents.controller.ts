import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('animalId') animalId: string,
  ) {
    if (!animalId) {
      throw new BadRequestException('animalId is required');
    }
    return this.documentsService.findByAnimal(tenantId, animalId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('animalId') animalId: string,
    @Query('notes') notes?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!animalId) {
      throw new BadRequestException('animalId is required');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${ALLOWED_MIMES.join(', ')}`,
      );
    }

    return this.documentsService.create({
      tenantId,
      animalId,
      uploadedBy: userId,
      file,
      notes,
    });
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.documentsService.remove(tenantId, id);
    if (!result) {
      throw new BadRequestException('Document not found');
    }
    return { message: 'Document deleted' };
  }
}
