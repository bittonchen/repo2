'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, CreditCard, XCircle, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  inventoryItemId?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod?: string;
  notes?: string;
  issuedAt: string;
  client?: { firstName: string; lastName: string };
  items?: InvoiceItem[];
}

interface ClientOption { id: string; firstName: string; lastName: string; }
interface InventoryOption { id: string; name: string; unitPrice: number; quantity: number; }

const statusLabels: Record<string, string> = {
  draft: 'טיוטה', sent: 'נשלח', paid: 'שולם', partially_paid: 'שולם חלקית', cancelled: 'בוטל',
};
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', partially_paid: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};
const paymentLabels: Record<string, string> = {
  cash: 'מזומן', credit_card: 'כרטיס אשראי', bank_transfer: 'העברה בנקאית', check: "צ'ק",
};

export default function PosPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [inventory, setInventory] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Invoice | null>(null);
  const [showPayment, setShowPayment] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const [createForm, setCreateForm] = useState({ clientId: '', notes: '' });
  const [lineItems, setLineItems] = useState<{ description: string; quantity: number; unitPrice: number; inventoryItemId: string }[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await apiFetch<Invoice[]>(`/pos/invoices${params}`, { token: token || undefined });
      setInvoices(Array.isArray(res) ? res : []);
    } catch { /* */ } finally { setLoading(false); }
  }, [statusFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const token = getToken();
      const [c, i] = await Promise.all([
        apiFetch<{ data: ClientOption[] }>('/clients?pageSize=100', { token: token || undefined }),
        apiFetch<InventoryOption[]>('/inventory', { token: token || undefined }),
      ]);
      setClients(c.data);
      setInventory(i);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, inventoryItemId: '' }]);
  };

  const updateLineItem = (idx: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = value;
    // Auto-fill from inventory
    if (field === 'inventoryItemId' && value) {
      const item = inventory.find((i) => i.id === value);
      if (item) {
        updated[idx].description = item.name;
        updated[idx].unitPrice = item.unitPrice;
      }
    }
    setLineItems(updated);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * 0.17;
  const total = subtotal + taxAmount;

  const openCreate = () => {
    setCreateForm({ clientId: '', notes: '' });
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, inventoryItemId: '' }]);
    setFormError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.clientId || lineItems.length === 0) {
      setFormError('בחרו לקוח והוסיפו לפחות פריט אחד');
      return;
    }
    const emptyItems = lineItems.some((i) => !i.description || i.unitPrice <= 0);
    if (emptyItems) { setFormError('מלאו תיאור ומחיר לכל הפריטים'); return; }

    setSaving(true); setFormError('');
    try {
      const token = getToken();
      await apiFetch('/pos/invoices', {
        method: 'POST', token: token || undefined,
        body: JSON.stringify({
          clientId: createForm.clientId,
          notes: createForm.notes || undefined,
          items: lineItems.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            inventoryItemId: i.inventoryItemId || undefined,
          })),
        }),
      });
      setShowCreate(false); fetchInvoices();
    } catch (err: any) { setFormError(err.message || 'שגיאה ביצירת חשבונית'); }
    finally { setSaving(false); }
  };

  const viewInvoice = async (id: string) => {
    try {
      const token = getToken();
      const res = await apiFetch<Invoice>(`/pos/invoices/${id}`, { token: token || undefined });
      setShowDetail(res);
    } catch { /* */ }
  };

  const handlePay = async () => {
    if (!showPayment) return;
    try {
      const token = getToken();
      await apiFetch(`/pos/invoices/${showPayment.id}/pay`, {
        method: 'POST', token: token || undefined,
        body: JSON.stringify({ paymentMethod }),
      });
      setShowPayment(null); fetchInvoices();
    } catch { /* */ }
  };

  const cancelInvoice = async (id: string) => {
    if (!confirm('האם לבטל את החשבונית?')) return;
    try {
      const token = getToken();
      await apiFetch(`/pos/invoices/${id}/cancel`, { method: 'POST', token: token || undefined });
      fetchInvoices();
    } catch { /* */ }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">קופה</h1>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />חשבונית חדשה</Button>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">חשבונית חדשה</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>לקוח *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}>
                  <option value="">בחרו לקוח</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Input value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-medium">פריטים</Label>
                <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="ml-1 h-3 w-3" />הוסף פריט</Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded border p-2">
                    <select className="h-9 w-40 rounded border px-2 text-sm" value={item.inventoryItemId} onChange={(e) => updateLineItem(idx, 'inventoryItemId', e.target.value)}>
                      <option value="">מוצר מהמלאי...</option>
                      {inventory.map((inv) => <option key={inv.id} value={inv.id}>{inv.name} (₪{inv.unitPrice})</option>)}
                    </select>
                    <Input className="h-9 flex-1" placeholder="תיאור" value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                    <Input className="h-9 w-20" type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)} dir="ltr" />
                    <Input className="h-9 w-24" type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} dir="ltr" />
                    <span className="w-20 text-left text-sm font-medium" dir="ltr">₪{(item.quantity * item.unitPrice).toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLineItem(idx)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between text-sm"><span>סה&quot;כ לפני מע&quot;מ:</span><span dir="ltr">₪{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>מע&quot;מ (17%):</span><span dir="ltr">₪{taxAmount.toFixed(2)}</span></div>
              <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold"><span>סה&quot;כ:</span><span dir="ltr">₪{total.toFixed(2)}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? 'יוצר...' : 'יצירת חשבונית'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">חשבונית {showDetail.invoiceNumber}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}>✕</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>לקוח: {showDetail.client?.firstName} {showDetail.client?.lastName}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${statusColors[showDetail.status]}`}>{statusLabels[showDetail.status]}</span>
              </div>
              <div className="text-muted-foreground">תאריך: {new Date(showDetail.issuedAt).toLocaleDateString('he-IL')}</div>
              {showDetail.paymentMethod && <div>תשלום: {paymentLabels[showDetail.paymentMethod]}</div>}

              {showDetail.items && showDetail.items.length > 0 && (
                <div className="border-t pt-3">
                  <h3 className="mb-2 font-medium">פריטים</h3>
                  {showDetail.items.map((item, i) => (
                    <div key={i} className="flex justify-between border-b py-1.5 last:border-0">
                      <span>{item.description} × {item.quantity}</span>
                      <span dir="ltr">₪{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between"><span>סה&quot;כ לפני מע&quot;מ:</span><span dir="ltr">₪{showDetail.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>מע&quot;מ:</span><span dir="ltr">₪{showDetail.taxAmount.toFixed(2)}</span></div>
                <div className="mt-1 flex justify-between border-t pt-1 font-bold"><span>סה&quot;כ:</span><span dir="ltr">₪{showDetail.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">תשלום — {showPayment.invoiceNumber}</h2>
            <div className="mb-4 text-center text-2xl font-bold" dir="ltr">₪{showPayment.total.toFixed(2)}</div>
            <div className="mb-4 space-y-2">
              <Label>אמצעי תשלום</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(paymentLabels).map(([key, label]) => (
                  <button key={key} className={`rounded-lg border p-3 text-sm transition ${paymentMethod === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`} onClick={() => setPaymentMethod(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPayment(null)}>ביטול</Button>
              <Button onClick={handlePay}>אישור תשלום</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Invoices List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="py-8 text-center text-muted-foreground">טוען...</div>
          : invoices.length === 0 ? <div className="py-8 text-center text-muted-foreground">אין חשבוניות</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-right">
                  <th className="pb-3 font-medium text-muted-foreground">מספר</th>
                  <th className="pb-3 font-medium text-muted-foreground">לקוח</th>
                  <th className="pb-3 font-medium text-muted-foreground">סכום</th>
                  <th className="pb-3 font-medium text-muted-foreground">סטטוס</th>
                  <th className="pb-3 font-medium text-muted-foreground">תאריך</th>
                  <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                </tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 font-medium" dir="ltr">{inv.invoiceNumber}</td>
                      <td className="py-3">{inv.client?.firstName} {inv.client?.lastName}</td>
                      <td className="py-3" dir="ltr">₪{inv.total.toFixed(2)}</td>
                      <td className="py-3"><span className={`rounded px-2 py-0.5 text-xs ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span></td>
                      <td className="py-3">{new Date(inv.issuedAt).toLocaleDateString('he-IL')}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewInvoice(inv.id)} title="צפייה"><Eye className="h-4 w-4" /></Button>
                          {(inv.status === 'draft' || inv.status === 'sent') && (
                            <Button variant="ghost" size="icon" onClick={() => { setPaymentMethod('credit_card'); setShowPayment(inv); }} title="תשלום"><CreditCard className="h-4 w-4 text-green-600" /></Button>
                          )}
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <Button variant="ghost" size="icon" onClick={() => cancelInvoice(inv.id)} title="ביטול"><XCircle className="h-4 w-4 text-red-500" /></Button>
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
