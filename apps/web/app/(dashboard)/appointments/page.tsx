'use client';

import { useState, useEffect, useCallback, DragEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChevronRight, ChevronLeft, Clock, CalendarDays, Calendar as CalendarIcon, Download, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Appointment {
  id: string;
  clientId: string;
  animalId: string;
  veterinarianId: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  client?: { firstName: string; lastName: string };
  animal?: { name: string; species: string };
  veterinarian?: { id: string; name: string };
}

interface Vet { id: string; name: string; }
interface ClientOption { id: string; firstName: string; lastName: string; }
interface AnimalOption { id: string; name: string; clientId: string; }

const statusLabels: Record<string, string> = {
  pending: 'ממתין', confirmed: 'אושר', in_progress: 'בטיפול',
  completed: 'הושלם', cancelled: 'בוטל', no_show: 'לא הגיע',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800', no_show: 'bg-red-100 text-red-800',
};

const emptyForm = {
  clientId: '', animalId: '', veterinarianId: '', startTime: '', endTime: '', type: '', notes: '',
};

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

type ViewMode = 'day' | 'week' | 'month';

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthDays(date: Date) {
  const start = getMonthStart(date);
  const firstDayOfWeek = start.getDay(); // 0=Sun
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const days: (Date | null)[] = [];
  // Pad start
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(date.getFullYear(), date.getMonth(), i));
  // Pad end to fill last week
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsContent />
    </Suspense>
  );
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState<Vet[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Drag and drop state
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      let res: Appointment[];
      if (viewMode === 'month') {
        const monthStart = getMonthStart(new Date(selectedDate));
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        // Fetch full month by fetching each week that overlaps (reuse week endpoint)
        const weeks: Appointment[][] = [];
        let current = getWeekStart(monthStart);
        while (current <= monthEnd) {
          const weekData = await apiFetch<Appointment[]>(`/appointments/week?startDate=${formatDate(current)}`, { token: token || undefined });
          weeks.push(weekData);
          current = new Date(current);
          current.setDate(current.getDate() + 7);
        }
        // Deduplicate by id
        const map = new Map<string, Appointment>();
        weeks.flat().forEach((a) => map.set(a.id, a));
        res = Array.from(map.values());
      } else if (viewMode === 'week') {
        const weekStart = getWeekStart(new Date(selectedDate));
        res = await apiFetch<Appointment[]>(`/appointments/week?startDate=${formatDate(weekStart)}`, { token: token || undefined });
      } else {
        res = await apiFetch<Appointment[]>(`/appointments?date=${selectedDate}`, { token: token || undefined });
      }
      setAppointments(res);
    } catch { /* */ } finally { setLoading(false); }
  }, [selectedDate, viewMode]);

  const fetchOptions = useCallback(async () => {
    try {
      const token = getToken();
      const [clientsRes, animalsRes, vetsRes] = await Promise.all([
        apiFetch<{ data: ClientOption[] }>('/clients?pageSize=100', { token: token || undefined }),
        apiFetch<AnimalOption[]>('/animals', { token: token || undefined }),
        apiFetch<any>('/employees?role=veterinarian', { token: token || undefined }).catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data);
      setAnimals(animalsRes);
      const vetData = Array.isArray(vetsRes) ? vetsRes : vetsRes.data || [];
      setVets(vetData);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  // Auto-open create form when navigated with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + (days > 0 ? 1 : -1));
    } else {
      d.setDate(d.getDate() + days);
    }
    setSelectedDate(formatDate(d));
  };

  const clientAnimals = animals.filter((a) => a.clientId === form.clientId);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      startTime: `${selectedDate}T09:00`,
      endTime: `${selectedDate}T09:30`,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.animalId || !form.veterinarianId || !form.startTime || !form.endTime || !form.type) {
      setFormError('כל השדות המסומנים הם חובה');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      await apiFetch('/appointments', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        }),
      });
      setShowForm(false);
      fetchAppointments();
    } catch (err: any) { setFormError(err.message || 'שגיאה ביצירת תור'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const original = [...appointments];
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      const token = getToken();
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ status }),
      });
    } catch {
      // Rollback on error
      setAppointments(original);
    }
  };

  const downloadIcal = async (id: string) => {
    try {
      const token = getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/appointments/${id}/ical`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment-${id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* */ }
  };

  const openGoogleCalendar = (appt: Appointment) => {
    const start = new Date(appt.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(appt.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(`${appt.type} - ${appt.animal?.name || ''}`);
    const details = encodeURIComponent(
      `לקוח: ${appt.client?.firstName || ''} ${appt.client?.lastName || ''}\nחיה: ${appt.animal?.name || ''}${appt.veterinarian ? `\nוטרינר: ${appt.veterinarian.name}` : ''}${appt.notes ? `\nהערות: ${appt.notes}` : ''}`
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`,
      '_blank'
    );
  };

  // ─── Drag & Drop handlers ────────────────────────────────────────────

  const handleDragStart = (e: DragEvent<HTMLDivElement>, appt: Appointment) => {
    const dragData = {
      appointmentId: appt.id,
      originalStartTime: appt.startTime,
      originalEndTime: appt.endTime,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverDay = (e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dateStr);
  };

  const handleDragOverHour = (e: DragEvent<HTMLDivElement>, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverHour(hour);
  };

  const handleDragLeaveDay = () => {
    setDragOverDay(null);
  };

  const handleDragLeaveHour = () => {
    setDragOverHour(null);
  };

  const handleDropOnDay = async (e: DragEvent<HTMLDivElement>, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDay(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    const dragData = JSON.parse(raw);
    const originalStart = new Date(dragData.originalStartTime);
    const originalEnd = new Date(dragData.originalEndTime);
    const targetDate = new Date(targetDateStr);

    // Keep the same time of day, change the date
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds(), originalStart.getMilliseconds());

    const newEnd = new Date(targetDate);
    newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), originalEnd.getSeconds(), originalEnd.getMilliseconds());

    // If the end time spans midnight, preserve the day offset
    const dayDiff = Math.floor((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff > 0) {
      newEnd.setDate(newEnd.getDate() + dayDiff);
    }

    // Skip if dropped on the same day
    if (formatDate(newStart) === formatDate(originalStart)) return;

    const original = [...appointments];
    // Optimistic update
    setAppointments(prev => prev.map(a =>
      a.id === dragData.appointmentId
        ? { ...a, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
        : a
    ));

    try {
      const token = getToken();
      await apiFetch(`/appointments/${dragData.appointmentId}`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });
    } catch {
      // Rollback on error
      setAppointments(original);
    }
  };

  const handleDropOnHour = async (e: DragEvent<HTMLDivElement>, targetHour: number) => {
    e.preventDefault();
    setDragOverHour(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    const dragData = JSON.parse(raw);
    const originalStart = new Date(dragData.originalStartTime);
    const originalEnd = new Date(dragData.originalEndTime);

    // Skip if dropped on the same hour
    if (originalStart.getHours() === targetHour) return;

    // Calculate duration in ms and build new times
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    const newStart = new Date(originalStart);
    newStart.setHours(targetHour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    const original = [...appointments];
    // Optimistic update
    setAppointments(prev => prev.map(a =>
      a.id === dragData.appointmentId
        ? { ...a, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
        : a
    ));

    try {
      const token = getToken();
      await apiFetch(`/appointments/${dragData.appointmentId}`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });
    } catch {
      // Rollback on error
      setAppointments(original);
    }
  };

  // ─── End Drag & Drop handlers ────────────────────────────────────────

  const dateDisplay = new Date(selectedDate).toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  const renderAppointmentCard = (appt: Appointment) => (
    <div
      key={appt.id}
      className={`rounded-lg border px-3 py-2 text-sm ${statusColors[appt.status] || 'bg-gray-50'}`}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        <span dir="ltr">{formatTime(appt.startTime)} - {formatTime(appt.endTime)}</span>
      </div>
      <div className="mt-1 font-medium">
        <Link href={`/appointments/${appt.id}`} className="hover:underline">{appt.animal?.name}</Link> — {appt.client?.firstName} {appt.client?.lastName}
      </div>
      <div className="text-xs">
        <Link href={`/appointments/${appt.id}`} className="hover:underline">{appt.type}</Link>
      </div>
      {appt.veterinarian && <div className="text-xs text-muted-foreground">{appt.veterinarian.name}</div>}
      <div className="mt-2 flex flex-wrap gap-1">
        <Link href={`/appointments/${appt.id}`} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border inline-flex items-center gap-1" title="פרטי התור">
          <Eye className="inline h-3 w-3" /> פרטים
        </Link>
        {appt.status === 'pending' && (
          <button onClick={() => updateStatus(appt.id, 'confirmed')} className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white">אשר</button>
        )}
        {(appt.status === 'confirmed' || appt.status === 'pending') && (
          <button onClick={() => updateStatus(appt.id, 'in_progress')} className="rounded bg-purple-500 px-2 py-0.5 text-xs text-white">התחל טיפול</button>
        )}
        {appt.status === 'in_progress' && (
          <button onClick={() => updateStatus(appt.id, 'completed')} className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">סיים</button>
        )}
        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
          <button onClick={() => updateStatus(appt.id, 'cancelled')} className="rounded bg-gray-400 px-2 py-0.5 text-xs text-white">בטל</button>
        )}
        <button onClick={() => downloadIcal(appt.id)} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border" title="הורד קובץ iCal">
          <Download className="inline h-3 w-3" /> iCal
        </button>
        <button onClick={() => openGoogleCalendar(appt)} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border" title="הוסף ל-Google Calendar">
          <CalendarIcon className="inline h-3 w-3" /> Google
        </button>
      </div>
    </div>
  );

  // Week view data
  const weekStart = getWeekStart(new Date(selectedDate));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">תורים</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'day' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              <CalendarIcon className="inline h-4 w-4 ml-1" />יום
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              <CalendarDays className="inline h-4 w-4 ml-1" />שבוע
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              <CalendarDays className="inline h-4 w-4 ml-1" />חודש
            </button>
          </div>
          <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />תור חדש</Button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">תור חדש</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>לקוח *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, animalId: '' })}>
                  <option value="">בחרו לקוח</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>חיה *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })} disabled={!form.clientId}>
                  <option value="">בחרו חיה</option>
                  {clientAnimals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>וטרינר *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.veterinarianId} onChange={(e) => setForm({ ...form, veterinarianId: e.target.value })}>
                  <option value="">בחרו וטרינר</option>
                  {vets.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>התחלה *</Label><Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>סיום *</Label><Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} dir="ltr" /></div>
              <div className="col-span-2 space-y-2"><Label>סוג ביקור *</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="ביקורת שגרתית, חיסון, ניתוח..." /></div>
              <div className="col-span-2 space-y-2"><Label>הערות</Label><textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'קביעת תור'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <Button variant="ghost" size="icon" onClick={() => changeDate(viewMode === 'month' ? -1 : viewMode === 'week' ? -7 : -1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="font-medium">{dateDisplay}</div>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setSelectedDate(formatDate(new Date()))}>
              היום
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(viewMode === 'month' ? 1 : viewMode === 'week' ? 7 : 1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">טוען...</div>
      ) : viewMode === 'day' ? (
        /* Day View with drag & drop on hour rows */
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourAppts = appointments.filter((a) => new Date(a.startTime).getHours() === hour);
            const isDropTarget = dragOverHour === hour;
            return (
              <div
                key={hour}
                className={`flex min-h-[60px] gap-4 border-b py-2 transition-colors ${isDropTarget ? 'bg-blue-100 border-blue-400' : ''}`}
                onDragOver={(e) => handleDragOverHour(e, hour)}
                onDragLeave={handleDragLeaveHour}
                onDrop={(e) => handleDropOnHour(e, hour)}
              >
                <div className="w-16 pt-1 text-sm text-muted-foreground" dir="ltr">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  {hourAppts.map((appt) => (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appt)}
                      className={`cursor-grab active:cursor-grabbing rounded-lg border px-3 py-2 text-sm ${statusColors[appt.status] || 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span dir="ltr">{formatTime(appt.startTime)} - {formatTime(appt.endTime)}</span>
                      </div>
                      <div className="mt-1 font-medium">
                        <Link href={`/appointments/${appt.id}`} className="hover:underline">{appt.animal?.name}</Link> — {appt.client?.firstName} {appt.client?.lastName}
                      </div>
                      <div className="text-xs">
                        <Link href={`/appointments/${appt.id}`} className="hover:underline">{appt.type}</Link>
                      </div>
                      {appt.veterinarian && <div className="text-xs text-muted-foreground">{appt.veterinarian.name}</div>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Link href={`/appointments/${appt.id}`} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border inline-flex items-center gap-1" title="פרטי התור">
                          <Eye className="inline h-3 w-3" /> פרטים
                        </Link>
                        {appt.status === 'pending' && (
                          <button onClick={() => updateStatus(appt.id, 'confirmed')} className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white">אשר</button>
                        )}
                        {(appt.status === 'confirmed' || appt.status === 'pending') && (
                          <button onClick={() => updateStatus(appt.id, 'in_progress')} className="rounded bg-purple-500 px-2 py-0.5 text-xs text-white">התחל טיפול</button>
                        )}
                        {appt.status === 'in_progress' && (
                          <button onClick={() => updateStatus(appt.id, 'completed')} className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">סיים</button>
                        )}
                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <button onClick={() => updateStatus(appt.id, 'cancelled')} className="rounded bg-gray-400 px-2 py-0.5 text-xs text-white">בטל</button>
                        )}
                        <button onClick={() => downloadIcal(appt.id)} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border" title="הורד קובץ iCal">
                          <Download className="inline h-3 w-3" /> iCal
                        </button>
                        <button onClick={() => openGoogleCalendar(appt)} className="rounded bg-white/80 px-2 py-0.5 text-xs text-gray-700 border" title="הוסף ל-Google Calendar">
                          <CalendarIcon className="inline h-3 w-3" /> Google
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {appointments.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">אין תורים ביום זה</div>
          )}
        </div>
      ) : viewMode === 'week' ? (
        /* Week View with drag & drop on day columns */
        <div className="overflow-x-auto">
          <div className="grid min-w-[800px] grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dateStr = formatDate(day);
              const isToday = dateStr === formatDate(new Date());
              const isDropTarget = dragOverDay === dateStr;
              const dayAppts = appointments.filter(
                (a) => formatDate(new Date(a.startTime)) === dateStr,
              );
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-2 min-h-[120px] transition-colors ${isToday ? 'border-blue-400 bg-blue-50/50' : ''} ${isDropTarget ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' : ''}`}
                  onDragOver={(e) => handleDragOverDay(e, dateStr)}
                  onDragLeave={handleDragLeaveDay}
                  onDrop={(e) => handleDropOnDay(e, dateStr)}
                >
                  <div className="mb-2 text-center">
                    <div className="text-xs text-muted-foreground">{dayNames[day.getDay()]}</div>
                    <div className={`text-lg font-medium ${isToday ? 'text-blue-600' : ''}`}>{day.getDate()}</div>
                  </div>
                  <div className="space-y-1">
                    {dayAppts.map((appt) => (
                      <div
                        key={appt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appt)}
                        className={`cursor-grab active:cursor-grabbing rounded border px-2 py-1 text-xs ${statusColors[appt.status] || 'bg-gray-50'}`}
                      >
                        <div dir="ltr" className="font-medium">{formatTime(appt.startTime)}</div>
                        <div className="truncate">{appt.animal?.name}</div>
                        <div className="truncate text-muted-foreground">{appt.type}</div>
                      </div>
                    ))}
                    {dayAppts.length === 0 && (
                      <div className="py-2 text-center text-xs text-muted-foreground">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month View */
        <div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {dayNames.map((name) => <div key={name} className="py-1 font-medium">{name}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getMonthDays(new Date(selectedDate)).map((day, i) => {
              if (!day) return <div key={i} className="min-h-[80px] rounded bg-gray-50" />;
              const dateStr = formatDate(day);
              const isToday = dateStr === formatDate(new Date());
              const dayAppts = appointments.filter(
                (a) => formatDate(new Date(a.startTime)) === dateStr,
              );
              return (
                <div
                  key={i}
                  className={`min-h-[80px] rounded border p-1 text-xs cursor-pointer hover:bg-gray-50 ${isToday ? 'border-blue-400 bg-blue-50/50' : ''}`}
                  onClick={() => { setSelectedDate(dateStr); setViewMode('day'); }}
                >
                  <div className={`mb-1 text-left font-medium ${isToday ? 'text-blue-600' : ''}`}>{day.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map((appt) => (
                      <div key={appt.id} className={`truncate rounded px-1 py-0.5 ${statusColors[appt.status] || 'bg-gray-100'}`}>
                        {formatTime(appt.startTime)} {appt.animal?.name}
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-muted-foreground text-center">+{dayAppts.length - 3} עוד</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
