import { Injectable, Logger } from '@nestjs/common';

/**
 * PACS Service — Orthanc REST API client
 *
 * Orthanc is an open-source DICOM server.
 * This service proxies requests to an Orthanc instance configured per-tenant.
 *
 * Required tenant settings:
 *   settings.pacs.orthancUrl   — e.g. "http://localhost:8042"
 *   settings.pacs.username     — Orthanc basic auth username
 *   settings.pacs.password     — Orthanc basic auth password
 */

interface PacsConfig {
  orthancUrl: string;
  username?: string;
  password?: string;
}

interface OrthancStudy {
  ID: string;
  MainDicomTags: {
    StudyInstanceUID: string;
    StudyDate?: string;
    StudyDescription?: string;
    AccessionNumber?: string;
    ReferringPhysicianName?: string;
  };
  Series: string[];
  PatientMainDicomTags?: {
    PatientName?: string;
    PatientID?: string;
  };
}

interface OrthancSeries {
  ID: string;
  MainDicomTags: {
    SeriesInstanceUID: string;
    SeriesNumber?: string;
    SeriesDescription?: string;
    Modality?: string;
    BodyPartExamined?: string;
  };
  Instances: string[];
}

@Injectable()
export class PacsService {
  private readonly logger = new Logger(PacsService.name);

  private getHeaders(config: PacsConfig): Record<string, string> {
    const headers: Record<string, string> = {};
    if (config.username && config.password) {
      headers['Authorization'] =
        'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
    }
    return headers;
  }

  async testConnection(config: PacsConfig): Promise<{ connected: boolean; version?: string }> {
    try {
      const res = await fetch(`${config.orthancUrl}/system`, {
        headers: this.getHeaders(config),
      });
      if (!res.ok) return { connected: false };
      const data = await res.json();
      return { connected: true, version: data.Version };
    } catch (err) {
      this.logger.warn(`PACS connection failed: ${err}`);
      return { connected: false };
    }
  }

  async listStudies(config: PacsConfig): Promise<OrthancStudy[]> {
    const res = await fetch(`${config.orthancUrl}/studies?expand`, {
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc error: ${res.status}`);
    return res.json();
  }

  async getStudy(config: PacsConfig, orthancStudyId: string): Promise<OrthancStudy> {
    const res = await fetch(`${config.orthancUrl}/studies/${orthancStudyId}`, {
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc study not found: ${res.status}`);
    return res.json();
  }

  async getStudySeries(config: PacsConfig, orthancStudyId: string): Promise<OrthancSeries[]> {
    const res = await fetch(`${config.orthancUrl}/studies/${orthancStudyId}/series`, {
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc error: ${res.status}`);
    return res.json();
  }

  async getInstancePreview(config: PacsConfig, orthancInstanceId: string): Promise<Buffer> {
    const res = await fetch(`${config.orthancUrl}/instances/${orthancInstanceId}/preview`, {
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc preview error: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async getInstanceDicom(config: PacsConfig, orthancInstanceId: string): Promise<Buffer> {
    const res = await fetch(`${config.orthancUrl}/instances/${orthancInstanceId}/file`, {
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc file error: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async uploadDicom(config: PacsConfig, dicomBuffer: Buffer): Promise<{
    ID: string;
    ParentStudy: string;
    ParentSeries: string;
    Status: string;
  }> {
    const res = await fetch(`${config.orthancUrl}/instances`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(config),
        'Content-Type': 'application/dicom',
      },
      body: new Uint8Array(dicomBuffer),
    });
    if (!res.ok) throw new Error(`Orthanc upload error: ${res.status}`);
    return res.json();
  }

  async deleteStudy(config: PacsConfig, orthancStudyId: string): Promise<void> {
    const res = await fetch(`${config.orthancUrl}/studies/${orthancStudyId}`, {
      method: 'DELETE',
      headers: this.getHeaders(config),
    });
    if (!res.ok) throw new Error(`Orthanc delete error: ${res.status}`);
  }

  // DICOMweb WADO-RS endpoints (for web viewers)
  getWadoRsUrl(config: PacsConfig, studyInstanceUid: string): string {
    return `${config.orthancUrl}/dicom-web/studies/${studyInstanceUid}`;
  }

  getViewerUrl(config: PacsConfig, studyInstanceUid: string): string {
    // Orthanc Stone Web Viewer URL
    return `${config.orthancUrl}/stone-webviewer/index.html?study=${studyInstanceUid}`;
  }

  // OHIF Viewer URL (if OHIF is deployed)
  getOhifViewerUrl(ohifBaseUrl: string, studyInstanceUid: string): string {
    return `${ohifBaseUrl}/viewer?StudyInstanceUIDs=${studyInstanceUid}`;
  }
}
