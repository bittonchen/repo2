'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bell, Send, X, Clock, Check, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Reminder {
  id: string;
  tenantId: string;
  animalId?: string;
  type: string;
  status: string;
  message: string;
  sendAt: string;
  sentAt?: string;
  channel: string;
  animal?: { id: string; name: string; client?: { firstName: string; lastName: string; phone: string } };
}

interface AnimalOption {
  id: string;
  name: string;
  clientId: string;
  client?: { firstName: string; lastName: string };
}

const typeLabels: Record<string, string> = {
  vaccination: 'חיסון',
  appointment: 'תור',
  follow_up: 'מעקב',
  custom: 'מותאם אישית',
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  sent: 'נשלח',
  failed: 'נכשל',
  cancelled: 'בוטל',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  sent: Check,
  failed: AlertTriangle,
  cancelled: X,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  sent: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-500 bg-gray-50',
};

const channelLabels: Record<string, string> = {
  sms: 'SMS',
  email: 'אימייל',
  whatsapp: 'WhatsApp',
};

const emptyForm = {
  animalId: '',
  type: 'custom',
  message: '',
  sendAt: '',
  channel: 'sms',
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch<Reminder[]>(`/reminders${qs}`, { token: token || undefined });
      setReminders(Array.isArray(res) ? res : []);
    } catch { /* */ } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  const fetchAnimals = useCallback(async () => {
    try {
      const token = getToken();
      const res = await apiFetch<AnimalOption[]>('/animals', { token: token || undefined });
      setAnimals(res);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);
  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  const openCreate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    setForm({ ...emptyForm, sendAt: dateStr });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.message || !form.sendAt) {
      setFormError('הודעה ותאריך שליחה הם שדות חובה');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      const body: any = {
        type: form.type,
        message: form.message,
        sendAt: new Date(form.sendAt).toISOString(),
        channel: form.channel,
      };
      if (form.animalId) body.animalId = form.animalId;

      await apiFetch('/reminders', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify(body),
      });
      setShowForm(false);
      fetchReminders();
    } catch (err: any) { setFormError(err.message || 'שגיאה ביצירת תזכורת'); }
    finally { setSaving(false); }
  };

  const cancelReminder = async (id: string) => {
    if (!confirm('האם לבטל את התזכורת?')) return;
    try {
      const token = getToken();
      await apiFetch(`/reminders/${id}/cancel`, { method: 'PATCH', token: token || undefined });
      fetchReminders();
    } catch { /* */ }
  };

  // Stats
  const pending = reminders.filter((r) => r.status === 'pending').length;
  const sent = reminders.filter((r) => r.status === 'sent').length;
  const failed = reminders.filter((r) => r.status === 'failed').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">תזכורות</h1>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />תזכורת חדשה</Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{pending}</div>
              <div className="text-sm text-muted-foreground">ממתינות</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Check className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{sent}</div>
              <div className="text-sm text-muted-foreground">נשלחו</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{failed}</div>
              <div className="text-sm text-muted-foreground">נכשלו</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">תזכורת חדשה</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>סוג תזכורת</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>חיה (אופציונלי)</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })}>
                  <option value="">ללא</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.client ? `(${a.client.firstName} ${a.client.lastName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>ערוץ שליחה</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                  {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>תאריך ושעת שליחה *</Label>
                <Input type="datetime-local" value={form.sendAt} onChange={(e) => setForm({ ...form, sendAt: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>תוכן ההודעה *</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="שלום, תזכורת לתור בקליניקה..."
                />
              </div>
              {/* Quick Templates */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">תבניות מהירות:</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => setForm({ ...form, message: 'שלום, תזכורת לתור בקליניקה הוטרינרית. נשמח לראותכם!', type: 'appointment' })}
                  >
                    תזכורת תור
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => setForm({ ...form, message: 'שלום, הגיע הזמן לחסן את חיית המחמד שלכם. אנא צרו קשר לקביעת תור.', type: 'vaccination' })}
                  >
                    תזכורת חיסון
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => setForm({ ...form, message: 'שלום, תזכורת לבדיקת מעקב לחיית המחמד שלכם. אנא צרו קשר.', type: 'follow_up' })}
                  >
                    תזכורת מעקב
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'יצירת תזכורת'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">כל הסוגים</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Reminders List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">טוען...</div>
          ) : reminders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">אין תזכורות</div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const StatusIcon = statusIcons[reminder.status] || Clock;
                const colorClass = statusColors[reminder.status] || '';
                return (
                  <div key={reminder.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex gap-3">
                      <div className={`rounded-full p-2 ${colorClass}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                            {typeLabels[reminder.type] || reminder.type}
                          </span>
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {channelLabels[reminder.channel] || reminder.channel}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-xs ${colorClass}`}>
                            {statusLabels[reminder.status] || reminder.status}
                          </span>
                        </div>
                        {reminder.animal && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {reminder.animal.name}
                            {reminder.animal.client && ` — ${reminder.animal.client.firstName} ${reminder.animal.client.lastName}`}
                          </div>
                        )}
                        <p className="mt-1 text-sm">{reminder.message}</p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          שליחה: {new Date(reminder.sendAt).toLocaleString('he-IL')}
                          {reminder.sentAt && ` | נשלח: ${new Date(reminder.sentAt).toLocaleString('he-IL')}`}
                        </div>
                      </div>
                    </div>
                    {reminder.status === 'pending' && (
                      <Button variant="ghost" size="icon" onClick={() => cancelReminder(reminder.id)} title="ביטול">
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
