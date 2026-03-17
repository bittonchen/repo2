'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Mail, MessageSquare, Phone, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface MessageLog {
  id: string;
  channel: string;
  recipient: string;
  subject?: string;
  body: string;
  status: string;
  createdAt: string;
  client?: { firstName: string; lastName: string };
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageSquare,
};

const channelLabels: Record<string, string> = {
  email: 'אימייל',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

export default function MessagesPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');

  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({
    channel: 'sms',
    recipient: '',
    subject: '',
    body: '',
    clientId: '',
  });
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = clientFilter ? `?clientId=${clientFilter}` : '';
      const res = await apiFetch<MessageLog[]>(`/messaging/log${params}`, { token: token || undefined });
      setLogs(Array.isArray(res) ? res : []);
    } catch { /* */ } finally { setLoading(false); }
  }, [clientFilter]);

  const fetchClients = useCallback(async () => {
    try {
      const token = getToken();
      const res = await apiFetch<{ data: ClientOption[] }>('/clients?pageSize=100', { token: token || undefined });
      setClients(res.data);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openSendForm = (client?: ClientOption) => {
    setSendForm({
      channel: 'sms',
      recipient: client?.phone || '',
      subject: '',
      body: '',
      clientId: client?.id || '',
    });
    setSendError('');
    setSendSuccess(false);
    setShowSend(true);
  };

  const handleSend = async () => {
    if (!sendForm.recipient || !sendForm.body) {
      setSendError('נמען ותוכן הם שדות חובה');
      return;
    }
    if (sendForm.channel === 'email' && !sendForm.subject) {
      setSendError('נושא הוא שדה חובה לאימייל');
      return;
    }
    setSending(true); setSendError(''); setSendSuccess(false);
    try {
      const token = getToken();
      const body: any = {
        channel: sendForm.channel,
        recipient: sendForm.recipient,
        body: sendForm.body,
      };
      if (sendForm.subject) body.subject = sendForm.subject;
      if (sendForm.clientId) body.clientId = sendForm.clientId;

      await apiFetch('/messaging/send', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify(body),
      });
      setSendSuccess(true);
      fetchLogs();
      setTimeout(() => setShowSend(false), 1500);
    } catch (err: any) { setSendError(err.message || 'שגיאה בשליחה'); }
    finally { setSending(false); }
  };

  const selectedClient = clients.find((c) => c.id === sendForm.clientId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">הודעות</h1>
        <Button onClick={() => openSendForm()}>
          <Send className="ml-2 h-4 w-4" />
          שליחת הודעה
        </Button>
      </div>

      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">שליחת הודעה</h2>
            {sendError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{sendError}</div>}
            {sendSuccess && <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">ההודעה נשלחה בהצלחה!</div>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ערוץ</Label>
                <div className="flex gap-2">
                  {Object.entries(channelLabels).map(([key, label]) => {
                    const Icon = channelIcons[key] || Mail;
                    return (
                      <button
                        key={key}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                          sendForm.channel === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSendForm({ ...sendForm, channel: key });
                          // Auto-fill recipient based on channel
                          if (selectedClient) {
                            if (key === 'email') setSendForm((f) => ({ ...f, channel: key, recipient: selectedClient.email || '' }));
                            else setSendForm((f) => ({ ...f, channel: key, recipient: selectedClient.phone }));
                          }
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>לקוח (אופציונלי)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sendForm.clientId}
                  onChange={(e) => {
                    const client = clients.find((c) => c.id === e.target.value);
                    setSendForm({
                      ...sendForm,
                      clientId: e.target.value,
                      recipient: client
                        ? (sendForm.channel === 'email' ? client.email || '' : client.phone)
                        : sendForm.recipient,
                    });
                  }}
                >
                  <option value="">בחרו לקוח</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>נמען *</Label>
                <Input
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                  dir="ltr"
                  placeholder={sendForm.channel === 'email' ? 'email@example.com' : '050-1234567'}
                />
              </div>
              {sendForm.channel === 'email' && (
                <div className="space-y-2">
                  <Label>נושא *</Label>
                  <Input
                    value={sendForm.subject}
                    onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>תוכן ההודעה *</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  placeholder="תוכן ההודעה..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSend(false)}>ביטול</Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? 'שולח...' : 'שליחה'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Client Filter */}
      <div className="mb-4">
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">כל הלקוחות</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
      </div>

      {/* Message Log */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית הודעות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">טוען...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">אין הודעות</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const ChannelIcon = channelIcons[log.channel] || Mail;
                return (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="rounded-full bg-gray-100 p-2">
                      <ChannelIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {channelLabels[log.channel] || log.channel}
                          </span>
                          <span className="text-sm text-muted-foreground" dir="ltr">{log.recipient}</span>
                          {log.client && (
                            <span className="text-sm text-muted-foreground">
                              ({log.client.firstName} {log.client.lastName})
                            </span>
                          )}
                        </div>
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          log.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {log.status === 'sent' ? 'נשלח' : log.status}
                        </span>
                      </div>
                      {log.subject && <div className="mt-1 text-sm font-medium">{log.subject}</div>}
                      <p className="mt-1 text-sm text-muted-foreground">{log.body}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('he-IL')}
                      </div>
                    </div>
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
