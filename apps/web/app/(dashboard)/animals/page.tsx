'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Animal {
  id: string;
  clientId: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  dateOfBirth?: string;
  weight?: number;
  microchipNumber?: string;
  isNeutered: boolean;
  notes?: string;
  client?: { id: string; firstName: string; lastName: string };
  medicalRecords?: MedicalRecord[];
}

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

const speciesLabels: Record<string, string> = {
  dog: 'כלב', cat: 'חתול', bird: 'ציפור', rabbit: 'ארנב',
  hamster: 'אוגר', reptile: 'זוחל', fish: 'דג', other: 'אחר',
};

const genderLabels: Record<string, string> = {
  male: 'זכר', female: 'נקבה', unknown: 'לא ידוע',
};

const emptyForm = {
  clientId: '', name: '', species: 'dog', breed: '', gender: 'unknown',
  dateOfBirth: '', weight: '', microchipNumber: '', isNeutered: false, notes: '',
};

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState<Animal | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await apiFetch<Animal[]>('/animals', { token: token || undefined });
      setAnimals(res);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const token = getToken();
      const res = await apiFetch<{ data: Client[] }>('/clients?pageSize=100', { token: token || undefined });
      setClients(res.data);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAnimals(); fetchClients(); }, [fetchAnimals, fetchClients]);

  const filtered = animals.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.name.toLowerCase().includes(s) || a.breed?.toLowerCase().includes(s) ||
      a.microchipNumber?.includes(s) ||
      `${a.client?.firstName} ${a.client?.lastName}`.toLowerCase().includes(s);
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormError(''); setClientSearch(''); setClientDropdownOpen(false); setShowForm(true); };

  const openEdit = (animal: Animal) => {
    setForm({
      clientId: animal.clientId, name: animal.name, species: animal.species,
      breed: animal.breed || '', gender: animal.gender,
      dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.split('T')[0] : '',
      weight: animal.weight?.toString() || '', microchipNumber: animal.microchipNumber || '',
      isNeutered: animal.isNeutered, notes: animal.notes || '',
    });
    setEditingId(animal.id); setFormError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.name) { setFormError('בעלים ושם החיה הם שדות חובה'); return; }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      const body: any = { name: form.name, species: form.species, gender: form.gender, isNeutered: form.isNeutered };
      if (!editingId) body.clientId = form.clientId;
      if (form.breed) body.breed = form.breed;
      if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth;
      if (form.weight) body.weight = parseFloat(form.weight);
      if (form.microchipNumber) body.microchipNumber = form.microchipNumber;
      if (form.notes) body.notes = form.notes;

      if (editingId) {
        await apiFetch(`/animals/${editingId}`, { method: 'PATCH', token: token || undefined, body: JSON.stringify(body) });
      } else {
        await apiFetch('/animals', { method: 'POST', token: token || undefined, body: JSON.stringify(body) });
      }
      setShowForm(false); fetchAnimals();
    } catch (err: any) { setFormError(err.message || 'שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את החיה?')) return;
    try { const token = getToken(); await apiFetch(`/animals/${id}`, { method: 'DELETE', token: token || undefined }); fetchAnimals(); } catch { /* */ }
  };

  const viewDetail = async (id: string) => {
    try { const token = getToken(); const res = await apiFetch<Animal>(`/animals/${id}`, { token: token || undefined }); setShowDetail(res); } catch { /* */ }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">חיות</h1>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />חיה חדשה</Button>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editingId ? 'עריכת חיה' : 'חיה חדשה'}</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>בעלים *</Label>
                {editingId ? (
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-muted-foreground">
                    {clients.find((c) => c.id === form.clientId)
                      ? `${clients.find((c) => c.id === form.clientId)!.firstName} ${clients.find((c) => c.id === form.clientId)!.lastName}`
                      : 'בעלים'}
                  </div>
                ) : (
                  <div className="relative" ref={clientDropdownRef}>
                    <Input
                      placeholder="חפשו לקוח לפי שם..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientDropdownOpen(true);
                        if (!e.target.value) setForm({ ...form, clientId: '' });
                      }}
                      onFocus={() => setClientDropdownOpen(true)}
                    />
                    {form.clientId && !clientDropdownOpen && (
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => { setForm({ ...form, clientId: '' }); setClientSearch(''); setClientDropdownOpen(true); }}
                        type="button"
                      >✕</button>
                    )}
                    {clientDropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                        {clients
                          .filter((c) => {
                            if (!clientSearch) return true;
                            const s = clientSearch.toLowerCase();
                            return `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
                              c.firstName.toLowerCase().includes(s) ||
                              c.lastName.toLowerCase().includes(s);
                          })
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="flex w-full items-center px-3 py-2 text-sm hover:bg-blue-50 text-right"
                              onClick={() => {
                                setForm({ ...form, clientId: c.id });
                                setClientSearch(`${c.firstName} ${c.lastName}`);
                                setClientDropdownOpen(false);
                              }}
                            >
                              {c.firstName} {c.lastName}
                            </button>
                          ))}
                        {clients.filter((c) => {
                          if (!clientSearch) return true;
                          const s = clientSearch.toLowerCase();
                          return `${c.firstName} ${c.lastName}`.toLowerCase().includes(s);
                        }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">לא נמצאו לקוחות</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label>שם החיה *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                  {Object.entries(speciesLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>גזע</Label><Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>מין</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>תאריך לידה</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>משקל (ק&quot;ג)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>מספר שבב</Label><Input value={form.microchipNumber} onChange={(e) => setForm({ ...form, microchipNumber: e.target.value })} dir="ltr" /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isNeutered" checked={form.isNeutered} onChange={(e) => setForm({ ...form, isNeutered: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="isNeutered">מסורס/מעוקרת</Label>
              </div>
              <div className="col-span-2 space-y-2"><Label>הערות</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{showDetail.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}>✕</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">סוג:</span> {speciesLabels[showDetail.species]}</div>
                <div><span className="text-muted-foreground">מין:</span> {genderLabels[showDetail.gender]}</div>
                {showDetail.breed && <div><span className="text-muted-foreground">גזע:</span> {showDetail.breed}</div>}
                {showDetail.weight && <div><span className="text-muted-foreground">משקל:</span> {showDetail.weight} ק&quot;ג</div>}
                {showDetail.dateOfBirth && <div><span className="text-muted-foreground">תאריך לידה:</span> {new Date(showDetail.dateOfBirth).toLocaleDateString('he-IL')}</div>}
                {showDetail.microchipNumber && <div><span className="text-muted-foreground">שבב:</span> {showDetail.microchipNumber}</div>}
                <div><span className="text-muted-foreground">מסורס:</span> {showDetail.isNeutered ? 'כן' : 'לא'}</div>
              </div>
              {showDetail.notes && <div><span className="text-muted-foreground">הערות:</span><p className="mt-1">{showDetail.notes}</p></div>}
              <div className="border-t pt-3">
                <h3 className="mb-2 font-medium">היסטוריה רפואית</h3>
                {showDetail.medicalRecords && showDetail.medicalRecords.length > 0 ? (
                  <div className="space-y-2">
                    {showDetail.medicalRecords.map((record) => (
                      <div key={record.id} className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString('he-IL')}</div>
                        {record.diagnosis && <div><strong>אבחנה:</strong> {record.diagnosis}</div>}
                        {record.treatment && <div><strong>טיפול:</strong> {record.treatment}</div>}
                        {record.prescription && <div><strong>מרשם:</strong> {record.prescription}</div>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">אין רשומות רפואיות</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="חיפוש לפי שם, גזע, שבב או בעלים..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="py-8 text-center text-muted-foreground">טוען...</div>
          : filtered.length === 0 ? <div className="py-8 text-center text-muted-foreground">{search ? 'לא נמצאו תוצאות' : 'אין חיות עדיין. הוסיפו חיה חדשה!'}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b text-right">
                  <th className="pb-3 font-medium text-muted-foreground">שם</th>
                  <th className="pb-3 font-medium text-muted-foreground">סוג</th>
                  <th className="pb-3 font-medium text-muted-foreground">גזע</th>
                  <th className="pb-3 font-medium text-muted-foreground">בעלים</th>
                  <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                </tr></thead>
                <tbody>
                  {filtered.map((animal) => (
                    <tr key={animal.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <Link href={`/animals/${animal.id}`} className="text-blue-600 hover:underline">
                          {animal.name}
                        </Link>
                      </td>
                      <td className="py-3">{speciesLabels[animal.species] || animal.species}</td>
                      <td className="py-3">{animal.breed || '—'}</td>
                      <td className="py-3">{animal.client ? `${animal.client.firstName} ${animal.client.lastName}` : '—'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewDetail(animal.id)} title="צפייה"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(animal)} title="עריכה"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(animal.id)} title="מחיקה"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
