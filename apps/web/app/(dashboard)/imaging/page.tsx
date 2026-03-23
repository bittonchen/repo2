'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MonitorDot, Plus, Search, Eye, Trash2, RefreshCw, FileImage,
  Radio, Wifi, WifiOff,
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
  createdAt: string;
  animal: { id: string; name: string; species: string };
  series: DicomSeries[];
}

const MODALITIES = [
  { value: 'CR', label: 'CR — Computed Radiography' },
  { value: 'DX', label: 'DX — Digital Radiography' },
  { value: 'US', label: 'US — Ultrasound' },
  { value: 'CT', label: 'CT — Computed Tomography' },
  { value: 'MR', label: 'MR — Magnetic Resonance' },
  { value: 'OT', label: 'OT — Other' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  received: { label: 'התקבל', color: 'bg-yellow-100 text-yellow-800' },
  reviewed: { label: 'נצפה', color: 'bg-blue-100 text-blue-800' },
  reported: { label: 'דווח', color: 'bg-green-100 text-green-800' },
};

export default function ImagingPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModality, setFilterModality] = useState('');

  // PACS connection
  const [pacsStatus, setPacsStatus] = useState<{ connected: boolean; version?: string } | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [animals, setAnimals] = useState<{ id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    animalId: '', studyInstanceUid: '', studyDate: '', studyDescription: '',
    modality: 'DX', accessionNumber: '', referringVet: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Report editing
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');

  const fetchStudies = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterModality) params.set('modality', filterModality);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<DicomStudy[]>(`/imaging/studies${query}`, { token });
      setStudies(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [filterModality]);

  const checkPacs = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const status = await apiFetch<{ connected: boolean; version?: string }>('/imaging/pacs/test', { token });
      setPacsStatus(status);
    } catch {
      setPacsStatus({ connected: false });
    }
  }, []);

  useEffect(() => { fetchStudies(); checkPacs(); }, [fetchStudies, checkPacs]);

  const openCreate = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const animalsData = await apiFetch<{ data: { id: string; name: string }[] }>('/animals', { token });
      setAnimals(animalsData.data || animalsData as any);
    } catch { /* ignore */ }
    setCreateForm({
      animalId: '', studyInstanceUid: `2.25.${Date.now()}.${Math.floor(Math.random() * 100000)}`,
      studyDate: new Date().toISOString().split('T')[0],
      studyDescription: '', modality: 'DX', accessionNumber: '', referringVet: '', notes: '',
    });
    setError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.animalId || !createForm.modality) {
      setError('יש לבחור חיה ומודאליטי');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      await apiFetch('/imaging/studies', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify(createForm),
      });
      setShowCreate(false);
      fetchStudies();
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת חקירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את החקירה? פעולה זו תמחק גם מה-PACS.')) return;
    const token = getToken();
    try {
      await apiFetch(`/imaging/studies/${id}`, { method: 'DELETE', token: token || undefined });
      fetchStudies();
    } catch { /* ignore */ }
  };

  const handleSaveReport = async (id: string) => {
    const token = getToken();
    try {
      await apiFetch(`/imaging/studies/${id}`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ reportText, status: 'reported' }),
      });
      setEditingReport(null);
      fetchStudies();
    } catch { /* ignore */ }
  };

  const handleSyncPacs = async (animalId: string) => {
    const token = getToken();
    try {
      await apiFetch(`/imaging/pacs/sync/${animalId}`, { method: 'POST', token: token || undefined });
      fetchStudies();
    } catch (err: any) {
      alert(err.message || 'שגיאת סנכרון PACS');
    }
  };

  const openViewer = (id: string) => {
    router.push(`/imaging/viewer/${id}`);
  };

  const filtered = studies.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.animal.name.toLowerCase().includes(q) &&
          !(s.studyDescription || '').toLowerCase().includes(q) &&
          !(s.modality || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MonitorDot className="h-7 w-7 text-blue-600" />
          הדמיה רפואית — DICOM / PACS
        </h1>
        <div className="flex items-center gap-2">
          {/* PACS status */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            pacsStatus?.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {pacsStatus?.connected ? (
              <><Wifi className="h-3 w-3" /> PACS מחובר {pacsStatus.version && `(v${pacsStatus.version})`}</>
            ) : (
              <><WifiOff className="h-3 w-3" /> PACS לא מחובר</>
            )}
          </div>
          <Button onClick={openCreate}>
            <Plus className="ml-2 h-4 w-4" />
            חקירה חדשה
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי חיה, תיאור..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterModality}
          onChange={e => setFilterModality(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל המודאליטים</option>
          {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
        </select>
      </div>

      {/* Studies grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileImage className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>אין חקירות הדמיה</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(study => {
            const st = STATUS_MAP[study.status] || STATUS_MAP.received;
            return (
              <Card key={study.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {study.studyDescription || study.modality || 'חקירה'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{study.animal.name}</p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${st.color}`}>{st.label}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-gray-700">מודאליטי:</span> {study.modality || '—'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">תאריך:</span>{' '}
                      {study.studyDate ? new Date(study.studyDate).toLocaleDateString('he-IL') : '—'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">סדרות:</span> {study.numberOfSeries}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">תמונות:</span> {study.numberOfInstances}
                    </div>
                    {study.referringVet && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">וטרינר:</span> {study.referringVet}
                      </div>
                    )}
                  </div>

                  {/* Report */}
                  {editingReport === study.id ? (
                    <div className="mb-3">
                      <textarea
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        className="w-full rounded border p-2 text-sm min-h-[80px]"
                        placeholder="ממצאים ופירוש..."
                      />
                      <div className="mt-1 flex gap-2">
                        <Button size="sm" onClick={() => handleSaveReport(study.id)}>שמור</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingReport(null)}>ביטול</Button>
                      </div>
                    </div>
                  ) : study.reportText ? (
                    <div
                      className="mb-3 rounded bg-blue-50 p-2 text-xs text-blue-900 cursor-pointer"
                      onClick={() => { setEditingReport(study.id); setReportText(study.reportText || ''); }}
                    >
                      <span className="font-medium">דו&quot;ח:</span> {study.reportText}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingReport(study.id); setReportText(''); }}
                      className="mb-3 text-xs text-blue-600 hover:underline"
                    >
                      + הוסף דו&quot;ח
                    </button>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openViewer(study.id)} className="flex-1">
                      <Eye className="ml-1 h-3 w-3" />
                      צפייה
                    </Button>
                    {pacsStatus?.connected && (
                      <Button size="sm" variant="outline" onClick={() => handleSyncPacs(study.animal.id)}>
                        <RefreshCw className="ml-1 h-3 w-3" />
                        סנכרון
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(study.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">חקירה חדשה</h2>
            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>חיה *</Label>
                <select
                  value={createForm.animalId}
                  onChange={e => setCreateForm({ ...createForm, animalId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">בחר חיה</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>מודאליטי *</Label>
                <select
                  value={createForm.modality}
                  onChange={e => setCreateForm({ ...createForm, modality: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Study Instance UID</Label>
                <Input value={createForm.studyInstanceUid} onChange={e => setCreateForm({ ...createForm, studyInstanceUid: e.target.value })} dir="ltr" className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label>תאריך חקירה</Label>
                <Input type="date" value={createForm.studyDate} onChange={e => setCreateForm({ ...createForm, studyDate: e.target.value })} dir="ltr" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>תיאור</Label>
                <Input value={createForm.studyDescription} onChange={e => setCreateForm({ ...createForm, studyDescription: e.target.value })} placeholder="e.g. Thorax AP, Abdomen" />
              </div>
              <div className="space-y-2">
                <Label>Accession Number</Label>
                <Input value={createForm.accessionNumber} onChange={e => setCreateForm({ ...createForm, accessionNumber: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>וטרינר מפנה</Label>
                <Input value={createForm.referringVet} onChange={e => setCreateForm({ ...createForm, referringVet: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>הערות</Label>
                <Input value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
