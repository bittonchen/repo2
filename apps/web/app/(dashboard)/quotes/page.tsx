'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Eye, Check, X, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  client?: { firstName: string; lastName: string };
}

interface ClientOption { id: string; firstName: string; lastName: string; }

const statusLabels: Record<string, string> = {
  draft: 'טיוטה', sent: 'נשלח', accepted: 'אושר', rejected: 'נדחה', expired: 'פג תוקף',
};
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700',
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Quote | null>(null);
  const [createForm, setCreateForm] = useState({ clientId: '', notes: '', validUntil: '' });
  const [lineItems, setLineItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiFetch<Quote[]>(`/quotes${params}`, { token: token || undefined });
      setQuotes(Array.isArray(res) ? res : []);
    } catch { /* */ } finally { setLoading(false); }
  }, [statusFilter]);

  const fetchClients = useCallback(async () => {
    try {
      const token = getToken();
      const res = await apiFetch<{ data: ClientOption[] }>('/clients?pageSize=100', { token: token || undefined });
      setClients(res.data);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  const addItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = value;
    setLineItems(updated);
  };
  const removeItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * 0.17;
  const total = subtotal + taxAmount;

  const openCreate = () => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    setCreateForm({ clientId: '', notes: '', validUntil: validDate.toISOString().split('T')[0] });
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setFormError(''); setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.clientId || lineItems.length === 0) { setFormError('בחרו לקוח והוסיפו לפחות פריט'); return; }
    if (lineItems.some((i) => !i.description || i.unitPrice <= 0)) { setFormError('מלאו תיאור ומחיר לכל הפריטים'); return; }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      await apiFetch('/quotes', {
        method: 'POST', token: token || undefined,
        body: JSON.stringify({
          clientId: createForm.clientId,
          items: lineItems,
          notes: createForm.notes || undefined,
          validUntil: createForm.validUntil || undefined,
        }),
      });
      setShowCreate(false); fetchQuotes();
    } catch (err: any) { setFormError(err.message || 'שגיאה'); }
    finally { setSaving(false); }
  };

  const acceptQuote = async (id: string) => {
    if (!confirm('אשר הצעת מחיר ויצור חשבונית?')) return;
    try { const token = getToken(); await apiFetch(`/quotes/${id}/accept`, { method: 'POST', token: token || undefined }); fetchQuotes(); } catch { /* */ }
  };

  const rejectQuote = async (id: string) => {
    if (!confirm('דחה הצעת מחיר?')) return;
    try { const token = getToken(); await apiFetch(`/quotes/${id}/reject`, { method: 'POST', token: token || undefined }); fetchQuotes(); } catch { /* */ }
  };

  const viewQuote = async (id: string) => {
    try { const token = getToken(); const res = await apiFetch<Quote>(`/quotes/${id}`, { token: token || undefined }); setShowDetail(res); } catch { /* */ }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">הצעות מחיר</h1>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />הצעה חדשה</Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">הצעת מחיר חדשה</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>לקוח *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}>
                  <option value="">בחרו לקוח</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>תוקף עד</Label><Input type="date" value={createForm.validUntil} onChange={(e) => setCreateForm({ ...createForm, validUntil: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>הערות</Label><Input value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} /></div>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-medium">פריטים</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="ml-1 h-3 w-3" />הוסף</Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded border p-2">
                    <Input className="h-9 flex-1" placeholder="תיאור" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                    <Input className="h-9 w-20" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} dir="ltr" />
                    <Input className="h-9 w-24" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} dir="ltr" />
                    <span className="w-20 text-left text-sm font-medium" dir="ltr">₪{(item.quantity * item.unitPrice).toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between text-sm"><span>סה&quot;כ לפני מע&quot;מ:</span><span dir="ltr">₪{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>מע&quot;מ (17%):</span><span dir="ltr">₪{taxAmount.toFixed(2)}</span></div>
              <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold"><span>סה&quot;כ:</span><span dir="ltr">₪{total.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'יוצר...' : 'יצירת הצעה'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">הצעה {showDetail.quoteNumber}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}>✕</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>לקוח: {showDetail.client?.firstName} {showDetail.client?.lastName}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${statusColors[showDetail.status]}`}>{statusLabels[showDetail.status]}</span>
              </div>
              {showDetail.validUntil && <div className="text-muted-foreground">תוקף עד: {new Date(showDetail.validUntil).toLocaleDateString('he-IL')}</div>}
              {showDetail.items && (
                <div className="border-t pt-3">
                  {showDetail.items.map((item, i) => (
                    <div key={i} className="flex justify-between border-b py-1.5 last:border-0">
                      <span>{item.description} × {item.quantity}</span>
                      <span dir="ltr">₪{(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between font-bold"><span>סה&quot;כ:</span><span dir="ltr">₪{showDetail.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Quotes List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="py-8 text-center text-muted-foreground">טוען...</div>
          : quotes.length === 0 ? <div className="py-8 text-center text-muted-foreground">אין הצעות מחיר</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b text-right">
                  <th className="pb-3 font-medium text-muted-foreground">מספר</th>
                  <th className="pb-3 font-medium text-muted-foreground">לקוח</th>
                  <th className="pb-3 font-medium text-muted-foreground">סכום</th>
                  <th className="pb-3 font-medium text-muted-foreground">סטטוס</th>
                  <th className="pb-3 font-medium text-muted-foreground">תוקף</th>
                  <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                </tr></thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b last:border-0">
                      <td className="py-3 font-medium" dir="ltr">{q.quoteNumber}</td>
                      <td className="py-3">{q.client?.firstName} {q.client?.lastName}</td>
                      <td className="py-3" dir="ltr">₪{q.total.toFixed(2)}</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-xs ${statusColors[q.status]}`}>{statusLabels[q.status]}</span></td>
                      <td className="py-3">{q.validUntil ? new Date(q.validUntil).toLocaleDateString('he-IL') : '—'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewQuote(q.id)} title="צפייה"><Eye className="h-4 w-4" /></Button>
                          {(q.status === 'draft' || q.status === 'sent') && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => acceptQuote(q.id)} title="אישור"><Check className="h-4 w-4 text-green-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => rejectQuote(q.id)} title="דחייה"><X className="h-4 w-4 text-red-500" /></Button>
                            </>
                          )}
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
