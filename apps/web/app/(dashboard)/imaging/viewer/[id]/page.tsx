'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, MonitorDot, FileText, Maximize2, ExternalLink,
  ChevronRight, ChevronLeft, Info,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface DicomInstance {
  id: string;
  sopInstanceUid: string;
  instanceNumber?: number;
  orthancInstanceId?: string;
  thumbnailUrl?: string;
}

interface DicomSeries {
  id: string;
  seriesDescription?: string;
  modality?: string;
  bodyPart?: string;
  numberOfInstances: number;
  instances: DicomInstance[];
}

interface DicomStudy {
  id: string;
  studyInstanceUid: string;
  studyDate?: string;
  studyDescription?: string;
  modality?: string;
  accessionNumber?: string;
  referringVet?: string;
  orthancStudyId?: string;
  numberOfSeries: number;
  numberOfInstances: number;
  status: string;
  reportText?: string;
  notes?: string;
  animal: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    client?: { firstName: string; lastName: string };
  };
  series: DicomSeries[];
}

export default function DicomViewerPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params.id as string;

  const [study, setStudy] = useState<DicomStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerUrls, setViewerUrls] = useState<{ viewerUrl?: string; wadoRsUrl?: string } | null>(null);

  // Selected series/instance for preview
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState(0);
  const [selectedInstanceIdx, setSelectedInstanceIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Report
  const [editingReport, setEditingReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSaving, setReportSaving] = useState(false);

  useEffect(() => {
    async function loadStudy() {
      const token = getToken();
      if (!token) return;
      try {
        const data = await apiFetch<DicomStudy>(`/imaging/studies/${studyId}`, { token });
        setStudy(data);
        setReportText(data.reportText || '');

        // Try to get viewer URL
        try {
          const urls = await apiFetch<{ viewerUrl: string; wadoRsUrl: string }>(
            `/imaging/studies/${studyId}/viewer`,
            { token },
          );
          setViewerUrls(urls);
        } catch {
          // PACS not configured, no viewer URL
        }
      } catch {
        router.push('/imaging');
      } finally {
        setLoading(false);
      }
    }
    loadStudy();
  }, [studyId, router]);

  // Load instance preview from Orthanc
  const loadPreview = async (instanceId: string) => {
    const token = getToken();
    if (!token) return;
    setPreviewLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/imaging/instances/${instanceId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch { /* ignore */ } finally {
      setPreviewLoading(false);
    }
  };

  // Navigate instances
  const currentSeries = study?.series[selectedSeriesIdx];
  const currentInstance = currentSeries?.instances[selectedInstanceIdx];
  const totalInstances = currentSeries?.instances.length || 0;

  useEffect(() => {
    if (currentInstance?.orthancInstanceId) {
      loadPreview(currentInstance.id);
    } else {
      setPreviewUrl(null);
    }
  }, [currentInstance?.id]);

  const goPrevInstance = () => {
    if (selectedInstanceIdx > 0) setSelectedInstanceIdx(selectedInstanceIdx - 1);
  };
  const goNextInstance = () => {
    if (selectedInstanceIdx < totalInstances - 1) setSelectedInstanceIdx(selectedInstanceIdx + 1);
  };

  const handleSaveReport = async () => {
    const token = getToken();
    if (!token || !study) return;
    setReportSaving(true);
    try {
      await apiFetch(`/imaging/studies/${study.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ reportText, status: 'reported' }),
      });
      setStudy({ ...study, reportText, status: 'reported' });
      setEditingReport(false);
    } catch { /* ignore */ } finally {
      setReportSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!study) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/imaging')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MonitorDot className="h-5 w-5 text-blue-600" />
              {study.studyDescription || study.modality || 'חקירה'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {study.animal.name}
              {study.animal.client && ` — ${study.animal.client.firstName} ${study.animal.client.lastName}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {viewerUrls?.viewerUrl && (
            <a href={viewerUrls.viewerUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="ml-2 h-4 w-4" />
                Stone Viewer
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Left panel: Study info + Series list */}
        <div className="space-y-4">
          {/* Study metadata */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Info className="h-4 w-4" />
                פרטי חקירה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div><span className="text-muted-foreground">UID:</span> <span dir="ltr" className="break-all">{study.studyInstanceUid}</span></div>
              <div><span className="text-muted-foreground">מודאליטי:</span> {study.modality || '—'}</div>
              <div><span className="text-muted-foreground">תאריך:</span> {study.studyDate ? new Date(study.studyDate).toLocaleDateString('he-IL') : '—'}</div>
              <div><span className="text-muted-foreground">Accession:</span> {study.accessionNumber || '—'}</div>
              <div><span className="text-muted-foreground">וטרינר:</span> {study.referringVet || '—'}</div>
              <div><span className="text-muted-foreground">סדרות:</span> {study.numberOfSeries}</div>
              <div><span className="text-muted-foreground">תמונות:</span> {study.numberOfInstances}</div>
              {study.notes && <div><span className="text-muted-foreground">הערות:</span> {study.notes}</div>}
            </CardContent>
          </Card>

          {/* Series list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">סדרות ({study.series.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {study.series.length === 0 ? (
                <p className="text-xs text-muted-foreground">אין סדרות</p>
              ) : study.series.map((series, i) => (
                <button
                  key={series.id}
                  onClick={() => { setSelectedSeriesIdx(i); setSelectedInstanceIdx(0); }}
                  className={`w-full rounded-lg border p-2 text-right text-xs transition-colors ${
                    selectedSeriesIdx === i ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    {series.seriesDescription || `סדרה ${series.seriesNumber || i + 1}`}
                  </div>
                  <div className="text-muted-foreground">
                    {series.modality} • {series.numberOfInstances} תמונות
                    {series.bodyPart && ` • ${series.bodyPart}`}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Report */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <FileText className="h-4 w-4" />
                דו&quot;ח
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingReport ? (
                <div>
                  <textarea
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                    className="w-full rounded border p-2 text-sm min-h-[120px]"
                    placeholder="ממצאים, פירוש ומסקנות..."
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={handleSaveReport} disabled={reportSaving}>
                      {reportSaving ? 'שומר...' : 'שמור'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReport(false)}>ביטול</Button>
                  </div>
                </div>
              ) : (
                <div>
                  {study.reportText ? (
                    <p className="text-sm whitespace-pre-wrap">{study.reportText}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">אין דו&quot;ח</p>
                  )}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditingReport(true)}>
                    {study.reportText ? 'ערוך דו"ח' : 'כתוב דו"ח'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main viewer area */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="bg-black relative" style={{ minHeight: '500px' }}>
              {viewerUrls?.viewerUrl ? (
                // Embedded Orthanc Stone Web Viewer
                <iframe
                  src={viewerUrls.viewerUrl}
                  className="w-full border-0"
                  style={{ height: '600px' }}
                  allow="fullscreen"
                  title="DICOM Viewer"
                />
              ) : previewUrl ? (
                // Image preview from Orthanc
                <div className="flex items-center justify-center p-4" style={{ minHeight: '500px' }}>
                  <img
                    src={previewUrl}
                    alt={`Instance ${selectedInstanceIdx + 1}`}
                    className="max-h-[550px] max-w-full object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              ) : previewLoading ? (
                <div className="flex items-center justify-center text-white" style={{ minHeight: '500px' }}>
                  <div className="text-center">
                    <div className="mb-2 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <p className="text-sm">טוען תמונה...</p>
                  </div>
                </div>
              ) : (
                // No viewer available
                <div className="flex items-center justify-center text-gray-400" style={{ minHeight: '500px' }}>
                  <div className="text-center">
                    <MonitorDot className="mx-auto mb-3 h-16 w-16" />
                    <p className="text-lg font-medium">DICOM Viewer</p>
                    <p className="text-sm mt-1">
                      {study.series.length === 0
                        ? 'אין תמונות בחקירה זו'
                        : 'חבר PACS (Orthanc) כדי לצפות בתמונות DICOM'}
                    </p>
                    {!viewerUrls && (
                      <p className="text-xs mt-3 text-gray-500">
                        הגדר Orthanc בהגדרות → PACS כדי להפעיל את הצופה
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Instance navigation overlay */}
              {totalInstances > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-black/70 px-4 py-2 text-white">
                  <button onClick={goPrevInstance} disabled={selectedInstanceIdx === 0} className="disabled:opacity-30">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium" dir="ltr">
                    {selectedInstanceIdx + 1} / {totalInstances}
                  </span>
                  <button onClick={goNextInstance} disabled={selectedInstanceIdx >= totalInstances - 1} className="disabled:opacity-30">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {currentSeries && currentSeries.instances.length > 1 && (
              <div className="flex gap-1 overflow-x-auto bg-gray-900 p-2">
                {currentSeries.instances.map((inst, i) => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstanceIdx(i)}
                    className={`shrink-0 rounded border-2 p-0.5 transition-colors ${
                      selectedInstanceIdx === i ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center bg-gray-800 text-gray-400 text-xs rounded">
                      {inst.thumbnailUrl ? (
                        <img src={inst.thumbnailUrl} alt="" className="h-full w-full object-cover rounded" />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
