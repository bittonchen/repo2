import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PacsService } from './pacs.service';
import { CreateDicomStudyDto, UpdateStudyReportDto } from './dto/create-study.dto';

@Injectable()
export class ImagingService {
  constructor(
    private prisma: PrismaService,
    private pacs: PacsService,
  ) {}

  async findAllStudies(tenantId: string, filters: {
    animalId?: string;
    modality?: string;
    status?: string;
  } = {}) {
    const where: any = { tenantId };
    if (filters.animalId) where.animalId = filters.animalId;
    if (filters.modality) where.modality = filters.modality;
    if (filters.status) where.status = filters.status;

    return this.prisma.dicomStudy.findMany({
      where,
      include: {
        animal: { select: { id: true, name: true, species: true } },
        series: {
          include: { instances: true },
          orderBy: { seriesNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStudyById(tenantId: string, id: string) {
    const study = await this.prisma.dicomStudy.findFirst({
      where: { id, tenantId },
      include: {
        animal: {
          select: {
            id: true, name: true, species: true, breed: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
        series: {
          include: { instances: true },
          orderBy: { seriesNumber: 'asc' },
        },
      },
    });
    if (!study) throw new NotFoundException('DICOM study not found');
    return study;
  }

  async createStudy(tenantId: string, dto: CreateDicomStudyDto) {
    // Check for duplicate study instance UID
    const existing = await this.prisma.dicomStudy.findUnique({
      where: { studyInstanceUid: dto.studyInstanceUid },
    });
    if (existing) {
      throw new BadRequestException('Study with this UID already exists');
    }

    return this.prisma.dicomStudy.create({
      data: {
        tenantId,
        animalId: dto.animalId,
        studyInstanceUid: dto.studyInstanceUid,
        studyDate: dto.studyDate ? new Date(dto.studyDate) : undefined,
        studyDescription: dto.studyDescription,
        modality: dto.modality,
        accessionNumber: dto.accessionNumber,
        referringVet: dto.referringVet,
        orthancStudyId: dto.orthancStudyId,
        numberOfSeries: dto.numberOfSeries || 0,
        numberOfInstances: dto.numberOfInstances || 0,
        notes: dto.notes,
      },
      include: {
        animal: { select: { id: true, name: true, species: true } },
        series: true,
      },
    });
  }

  async updateStudyReport(tenantId: string, id: string, dto: UpdateStudyReportDto) {
    await this.findStudyById(tenantId, id);
    return this.prisma.dicomStudy.update({
      where: { id },
      data: {
        reportText: dto.reportText,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async deleteStudy(tenantId: string, id: string) {
    const study = await this.findStudyById(tenantId, id);

    // If connected to Orthanc, delete from PACS too
    if (study.orthancStudyId) {
      const pacsConfig = await this.getPacsConfig(tenantId);
      if (pacsConfig) {
        try {
          await this.pacs.deleteStudy(pacsConfig, study.orthancStudyId);
        } catch {
          // PACS delete failure shouldn't block DB deletion
        }
      }
    }

    return this.prisma.dicomStudy.delete({ where: { id } });
  }

  // Sync studies from Orthanc PACS into our database
  async syncFromPacs(tenantId: string, animalId: string) {
    const pacsConfig = await this.getPacsConfig(tenantId);
    if (!pacsConfig) {
      throw new BadRequestException('PACS not configured for this clinic');
    }

    const orthancStudies = await this.pacs.listStudies(pacsConfig);
    const synced: any[] = [];

    for (const os of orthancStudies) {
      const uid = os.MainDicomTags.StudyInstanceUID;
      const existing = await this.prisma.dicomStudy.findUnique({
        where: { studyInstanceUid: uid },
      });
      if (existing) continue;

      // Get series for counts
      const series = await this.pacs.getStudySeries(pacsConfig, os.ID);
      const totalInstances = series.reduce((sum, s) => sum + s.Instances.length, 0);

      const study = await this.prisma.dicomStudy.create({
        data: {
          tenantId,
          animalId,
          studyInstanceUid: uid,
          studyDate: os.MainDicomTags.StudyDate
            ? new Date(os.MainDicomTags.StudyDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
            : undefined,
          studyDescription: os.MainDicomTags.StudyDescription,
          accessionNumber: os.MainDicomTags.AccessionNumber,
          referringVet: os.MainDicomTags.ReferringPhysicianName,
          orthancStudyId: os.ID,
          modality: series[0]?.MainDicomTags.Modality,
          numberOfSeries: series.length,
          numberOfInstances: totalInstances,
        },
      });

      // Create series and instances in our DB
      for (const s of series) {
        const dbSeries = await this.prisma.dicomSeries.create({
          data: {
            studyId: study.id,
            seriesInstanceUid: s.MainDicomTags.SeriesInstanceUID,
            seriesNumber: s.MainDicomTags.SeriesNumber ? parseInt(s.MainDicomTags.SeriesNumber) : undefined,
            seriesDescription: s.MainDicomTags.SeriesDescription,
            modality: s.MainDicomTags.Modality,
            bodyPart: s.MainDicomTags.BodyPartExamined,
            orthancSeriesId: s.ID,
            numberOfInstances: s.Instances.length,
          },
        });

        for (let i = 0; i < s.Instances.length; i++) {
          await this.prisma.dicomInstance.create({
            data: {
              seriesId: dbSeries.id,
              sopInstanceUid: `${s.MainDicomTags.SeriesInstanceUID}.${i + 1}`,
              instanceNumber: i + 1,
              orthancInstanceId: s.Instances[i],
            },
          });
        }
      }

      synced.push(study);
    }

    return { synced: synced.length, studies: synced };
  }

  // Get viewer URL for a study
  async getViewerUrl(tenantId: string, id: string) {
    const study = await this.findStudyById(tenantId, id);
    const pacsConfig = await this.getPacsConfig(tenantId);

    if (!pacsConfig || !study.orthancStudyId) {
      throw new BadRequestException('PACS not configured or study not linked to Orthanc');
    }

    return {
      viewerUrl: this.pacs.getViewerUrl(pacsConfig, study.studyInstanceUid),
      wadoRsUrl: this.pacs.getWadoRsUrl(pacsConfig, study.studyInstanceUid),
    };
  }

  // Get image preview from Orthanc
  async getInstancePreview(tenantId: string, instanceId: string) {
    const instance = await this.prisma.dicomInstance.findFirst({
      where: { id: instanceId },
      include: { series: { include: { study: true } } },
    });
    if (!instance || instance.series.study.tenantId !== tenantId) {
      throw new NotFoundException('Instance not found');
    }

    const pacsConfig = await this.getPacsConfig(tenantId);
    if (!pacsConfig || !instance.orthancInstanceId) {
      throw new BadRequestException('PACS not configured or instance not linked');
    }

    return this.pacs.getInstancePreview(pacsConfig, instance.orthancInstanceId);
  }

  // Test PACS connection
  async testPacsConnection(tenantId: string) {
    const pacsConfig = await this.getPacsConfig(tenantId);
    if (!pacsConfig) {
      return { connected: false, error: 'PACS not configured' };
    }
    return this.pacs.testConnection(pacsConfig);
  }

  private async getPacsConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;
    const settings = (tenant.settings as any) || {};
    const pacs = settings.pacs;
    if (!pacs?.orthancUrl) return null;
    return pacs as { orthancUrl: string; username?: string; password?: string };
  }
}
