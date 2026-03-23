'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FlaskConical, Plus, Search, Eye, Trash2, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock, XCircle, TrendingUp,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface LabTestResult {
  id: string;
  paramName: string;
  value: string;
  unit: string;
  refMin?: number;
  refMax?: number;
  flag?: string;
}

interface LabTest {
  id: string;
  testType: string;
  panelName?: string;
  status: string;
  orderedAt: string;
  completedAt?: string;
  deviceName?: string;
  notes?: string;
  animal: { id: string; name: string; species: string };
  veterinarian: { id: string; name: string };
  results: LabTestResult[];
}

const TEST_TYPES = [
  { value: 'hematology', label: 'המטולוגיה' },
  { value: 'biochemistry', label: 'ביוכימיה' },
  { value: 'urinalysis', label: 'שתן' },
  { value: 'cytology', label: 'ציטולוגיה' },
  { value: 'parasitology', label: 'פרזיטולוגיה' },
  { value: 'serology', label: 'סרולוגיה' },
  { value: 'other', label: 'אחר' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'בביצוע', color: 'bg-blue-100 text-blue-800', icon: ArrowUpDown },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const FLAG_COLORS: Record<string, string> = {
  H: 'text-red-600 font-bold',
  L: 'text-blue-600 font-bold',
  C: 'text-red-700 font-bold bg-red-50',
  N: 'text-gray-700',
};

const FLAG_LABELS: Record<string, string> = {
  H: 'גבוה',
  L: 'נמוך',
  C: 'קריטי',
  N: 'תקין',
};

// Common CBC reference ranges (dog defaults)
const CBC_DEFAULTS = [
  { paramName: 'WBC', unit: '10^3/uL', refMin: 5.5, refMax: 16.9 },
  { paramName: 'RBC', unit: '10^6/uL', refMin: 5.5, refMax: 8.5 },
  { paramName: 'HGB', unit: 'g/dL', refMin: 12, refMax: 18 },
  { paramName: 'HCT', unit: '%', refMin: 37, refMax: 55 },
  { paramName: 'MCV', unit: 'fL', refMin: 60, refMax: 74 },
  { paramName: 'MCH', unit: 'pg', refMin: 19.5, refMax: 24.5 },
  { paramName: 'MCHC', unit: 'g/dL', refMin: 32, refMax: 36 },
  { paramName: 'PLT', unit: '10^3/uL', refMin: 175, refMax: 500 },
];

const CHEM_DEFAULTS = [
  { paramName: 'Glucose', unit: 'mg/dL', refMin: 74, refMax: 143 },
  { paramName: 'BUN', unit: 'mg/dL', refMin: 7, refMax: 27 },
  { paramName: 'Creatinine', unit: 'mg/dL', refMin: 0.5, refMax: 1.8 },
  { paramName: 'ALT', unit: 'U/L', refMin: 10, refMax: 125 },
  { paramName: 'ALP', unit: 'U/L', refMin: 23, refMax: 212 },
  { paramName: 'Total Protein', unit: 'g/dL', refMin: 5.2, refMax: 8.2 },
  { paramName: 'Albumin', unit: 'g/dL', refMin: 2.3, refMax: 4.0 },
  { paramName: 'Calcium', unit: 'mg/dL', refMin: 7.9, refMax: 12.0 },
  { paramName: 'Phosphorus', unit: 'mg/dL', refMin: 2.5, refMax: 6.8 },
  { paramName: 'Sodium', unit: 'mEq/L', refMin: 144, refMax: 160 },
  { paramName: 'Potassium', unit: 'mEq/L', refMin: 3.5, refMax: 5.8 },
];

export default function LabPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [animals, setAnimals] = useState<{ id: string; name: string }[]>([]);
  const [vets, setVets] = useState<{ id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    animalId: '', veterinarianId: '', testType: 'hematology', panelName: '', notes: '',
  });
  const [createResults, setCreateResults] = useState<{ paramName: string; value: string; unit: string; refMin?: number; refMax?: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Detail view
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);

  // Trend view
  const [trendParam, setTrendParam] = useState('');
  const [trendAnimalId, setTrendAnimalId] = useState('');
  const [trendData, setTrendData] = useState<{ date: string; value: string; unit: string; refMin?: number; refMax?: number; flag?: string }[]>([]);
  const [showTrend, setShowTrend] = useState(false);

  const fetchTests = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('testType', filterType);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<LabTest[]>(`/lab${query}`, { token });
      setTests(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const openCreate = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [animalsData, usersData] = await Promise.all([
        apiFetch<{ data: { id: string; name: string }[] }>('/animals', { token }),
        apiFetch<{ data: { id: string; name: string }[] }>('/employees', { token }),
      ]);
      setAnimals(animalsData.data || animalsData as any);
      setVets(usersData.data || usersData as any);
    } catch { /* ignore */ }
    setCreateForm({ animalId: '', veterinarianId: '', testType: 'hematology', panelName: '', notes: '' });
    setCreateResults([]);
    setError('');
    setShowCreate(true);
  };

  const loadDefaultResults = (testType: string) => {
    if (testType === 'hematology') {
      setCreateResults(CBC_DEFAULTS.map(d => ({ ...d, value: '' })));
      setCreateForm(f => ({ ...f, panelName: 'CBC' }));
    } else if (testType === 'biochemistry') {
      setCreateResults(CHEM_DEFAULTS.map(d => ({ ...d, value: '' })));
      setCreateForm(f => ({ ...f, panelName: 'Chem Panel' }));
    } else {
      setCreateResults([{ paramName: '', value: '', unit: '', refMin: undefined, refMax: undefined }]);
    }
  };

  const handleCreate = async () => {
    if (!createForm.animalId || !createForm.veterinarianId) {
      setError('יש לבחור חיה ווטרינר');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const filledResults = createResults.filter(r => r.paramName && r.value);
      await apiFetch('/lab', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          ...createForm,
          results: filledResults.length > 0 ? filledResults : undefined,
        }),
      });
      setShowCreate(false);
      fetchTests();
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת בדיקה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את הבדיקה?')) return;
    const token = getToken();
    try {
      await apiFetch(`/lab/${id}`, { method: 'DELETE', token: token || undefined });
      fetchTests();
      if (selectedTest?.id === id) setSelectedTest(null);
    } catch { /* ignore */ }
  };

  const openTrend = async (animalId: string, paramName: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await apiFetch<any[]>(`/lab/trend/${animalId}/${paramName}`, { token });
      setTrendData(data);
      setTrendParam(paramName);
      setTrendAnimalId(animalId);
      setShowTrend(true);
    } catch { /* ignore */ }
  };

  const filtered = tests.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      if (!t.animal.name.toLowerCase().includes(s) &&
          !t.testType.toLowerCase().includes(s) &&
          !(t.panelName || '').toLowerCase().includes(s)) return false;
    }
    return true;
  });

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-purple-600" />
          מעבדה
        </h1>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          בדיקה חדשה
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי חיה, סוג בדיקה..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">כל סוגי הבדיקות</option>
          {TEST_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Main content: list + detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tests list */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                אין בדיקות מעבדה
              </CardContent>
            </Card>
          ) : filtered.map(test => {
            const st = STATUS_MAP[test.status] || STATUS_MAP.pending;
            const StIcon = st.icon;
            const abnormals = test.results.filter(r => r.flag && r.flag !== 'N').length;
            const typeLabel = TEST_TYPES.find(t => t.value === test.testType)?.label || test.testType;
            return (
              <Card
                key={test.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedTest?.id === test.id ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setSelectedTest(test)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-8 w-8 text-purple-400" />
                    <div>
                      <div className="font-medium">
                        {typeLabel}
                        {test.panelName && <span className="text-muted-foreground"> — {test.panelName}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {test.animal.name} • {test.veterinarian.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(test.orderedAt).toLocaleDateString('he-IL')}
                        {test.deviceName && ` • ${test.deviceName}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {abnormals > 0 && (
                      <span className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        {abnormals} חריג
                      </span>
                    )}
                    <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${st.color}`}>
                      <StIcon className="h-3 w-3" />
                      {st.label}
                    </span>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(test.id); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail panel */}
        <div>
          {selectedTest ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  תוצאות בדיקה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1 text-sm">
                  <div><span className="text-muted-foreground">חיה:</span> {selectedTest.animal.name}</div>
                  <div><span className="text-muted-foreground">וטרינר:</span> {selectedTest.veterinarian.name}</div>
                  <div><span className="text-muted-foreground">תאריך:</span> {new Date(selectedTest.orderedAt).toLocaleDateString('he-IL')}</div>
                  {selectedTest.notes && <div><span className="text-muted-foreground">הערות:</span> {selectedTest.notes}</div>}
                </div>

                {selectedTest.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ממתין לתוצאות...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-right">
                          <th className="pb-2 font-medium">פרמטר</th>
                          <th className="pb-2 font-medium">ערך</th>
                          <th className="pb-2 font-medium">יחידה</th>
                          <th className="pb-2 font-medium">טווח</th>
                          <th className="pb-2 font-medium w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.results.map(r => (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className="py-2 font-medium" dir="ltr">{r.paramName}</td>
                            <td className={`py-2 ${FLAG_COLORS[r.flag || 'N']}`} dir="ltr">
                              {r.value}
                              {r.flag && r.flag !== 'N' && (
                                <span className="mr-1 text-xs">({FLAG_LABELS[r.flag]})</span>
                              )}
                            </td>
                            <td className="py-2 text-muted-foreground" dir="ltr">{r.unit}</td>
                            <td className="py-2 text-muted-foreground text-xs" dir="ltr">
                              {r.refMin != null && r.refMax != null ? `${r.refMin}-${r.refMax}` : '—'}
                            </td>
                            <td className="py-2">
                              <button
                                onClick={() => openTrend(selectedTest.animal.id, r.paramName)}
                                className="text-purple-500 hover:text-purple-700"
                                title="הצג מגמה"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FlaskConical className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p>בחר בדיקה מהרשימה לצפייה בתוצאות</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">בדיקה חדשה</h2>
            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                <Label>וטרינר *</Label>
                <select
                  value={createForm.veterinarianId}
                  onChange={e => setCreateForm({ ...createForm, veterinarianId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">בחר וטרינר</option>
                  {vets.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>סוג בדיקה</Label>
                <select
                  value={createForm.testType}
                  onChange={e => {
                    setCreateForm({ ...createForm, testType: e.target.value });
                    loadDefaultResults(e.target.value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>שם פאנל</Label>
                <Input
                  value={createForm.panelName}
                  onChange={e => setCreateForm({ ...createForm, panelName: e.target.value })}
                  placeholder="e.g. CBC, Chem 10"
                  dir="ltr"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>הערות</Label>
                <Input
                  value={createForm.notes}
                  onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Results entry */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">תוצאות (אופציונלי)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateResults([...createResults, { paramName: '', value: '', unit: '', refMin: undefined, refMax: undefined }])}
                >
                  <Plus className="ml-1 h-3 w-3" />
                  שורה
                </Button>
              </div>
              {createResults.length > 0 && (
                <div className="overflow-x-auto rounded border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-right">
                        <th className="p-2 font-medium">פרמטר</th>
                        <th className="p-2 font-medium">ערך</th>
                        <th className="p-2 font-medium">יחידה</th>
                        <th className="p-2 font-medium">מינימום</th>
                        <th className="p-2 font-medium">מקסימום</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {createResults.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-1">
                            <Input value={r.paramName} onChange={e => { const arr = [...createResults]; arr[i] = { ...arr[i], paramName: e.target.value }; setCreateResults(arr); }} className="h-8 text-xs" dir="ltr" />
                          </td>
                          <td className="p-1">
                            <Input value={r.value} onChange={e => { const arr = [...createResults]; arr[i] = { ...arr[i], value: e.target.value }; setCreateResults(arr); }} className="h-8 text-xs" dir="ltr" />
                          </td>
                          <td className="p-1">
                            <Input value={r.unit} onChange={e => { const arr = [...createResults]; arr[i] = { ...arr[i], unit: e.target.value }; setCreateResults(arr); }} className="h-8 text-xs" dir="ltr" />
                          </td>
                          <td className="p-1">
                            <Input type="number" step="any" value={r.refMin ?? ''} onChange={e => { const arr = [...createResults]; arr[i] = { ...arr[i], refMin: e.target.value ? parseFloat(e.target.value) : undefined }; setCreateResults(arr); }} className="h-8 text-xs" dir="ltr" />
                          </td>
                          <td className="p-1">
                            <Input type="number" step="any" value={r.refMax ?? ''} onChange={e => { const arr = [...createResults]; arr[i] = { ...arr[i], refMax: e.target.value ? parseFloat(e.target.value) : undefined }; setCreateResults(arr); }} className="h-8 text-xs" dir="ltr" />
                          </td>
                          <td className="p-1">
                            <button onClick={() => setCreateResults(createResults.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'שומר...' : 'שמירה'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trend Modal */}
      {showTrend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              מגמת {trendParam}
            </h2>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין נתונים היסטוריים</p>
            ) : (
              <div className="space-y-2">
                {/* Simple chart using bars */}
                <div className="rounded border p-4">
                  {trendData.map((d, i) => {
                    const numVal = parseFloat(d.value);
                    const allVals = trendData.map(x => parseFloat(x.value)).filter(v => !isNaN(v));
                    const maxVal = Math.max(...allVals, d.refMax || 0);
                    const pct = isNaN(numVal) ? 0 : (numVal / maxVal) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">
                          {new Date(d.date).toLocaleDateString('he-IL')}
                        </span>
                        <div className="relative flex-1 h-6 bg-gray-100 rounded">
                          {d.refMin != null && d.refMax != null && (
                            <div
                              className="absolute h-full bg-green-50 rounded"
                              style={{
                                left: `${(d.refMin / maxVal) * 100}%`,
                                width: `${((d.refMax - d.refMin) / maxVal) * 100}%`,
                              }}
                            />
                          )}
                          <div
                            className={`absolute h-full rounded ${d.flag === 'H' || d.flag === 'C' ? 'bg-red-400' : d.flag === 'L' ? 'bg-blue-400' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm w-16 text-left ${FLAG_COLORS[d.flag || 'N']}`} dir="ltr">
                          {d.value} {d.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-500 inline-block" /> תקין</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-400 inline-block" /> גבוה</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-400 inline-block" /> נמוך</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-50 border inline-block" /> טווח תקין</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowTrend(false)}>סגור</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
