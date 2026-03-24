import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async findByAnimal(tenantId: string, animalId: string) {
    return this.prisma.document.findMany({
      where: { tenantId, animalId },
      include: { uploader: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    tenantId: string;
    animalId: string;
    uploadedBy: string;
    file: Express.Multer.File;
    notes?: string;
  }) {
    const { url, key } = await this.uploadService.upload(
      data.tenantId,
      data.file,
      'documents',
    );

    return this.prisma.document.create({
      data: {
        tenantId: data.tenantId,
        animalId: data.animalId,
        uploadedBy: data.uploadedBy,
        name: data.file.originalname,
        url,
        key,
        fileType: data.file.mimetype,
        fileSize: data.file.size,
        notes: data.notes,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });
    if (!doc) return null;

    await this.uploadService.delete(doc.key);
    return this.prisma.document.delete({ where: { id } });
  }
}
