'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  costPrice?: number;
  expiryDate?: string;
  supplierId?: string;
  supplier?: { name: string };
}

const categoryLabels: Record<string, string> = {
  medication: 'תרופות', food: 'מזון', equipment: 'ציוד', supplies: 'חומרים', other: 'אחר',
};

const emptyForm = {
  name: '', category: 'medication', sku: '', quantity: '0', minQuantity: '5',
  unitPrice: '0', costPrice: '', expiryDate: '', supplierId: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = categoryFilter ? `?category=${categoryFilter}` : '';
      const res = await apiFetch<InventoryItem[]>(`/inventory${params}`, { token: token || undefined });
      setItems(res);
    } catch { /* */ } finally { setLoading(false); }
  }, [categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    return item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase());
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minQuantity).length;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormError(''); setShowForm(true); };

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name, category: item.category, sku: item.sku || '',
      quantity: item.quantity.toString(), minQuantity: item.minQuantity.toString(),
      unitPrice: item.unitPrice.toString(), costPrice: item.costPrice?.toString() || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '', supplierId: item.supplierId || '',
    });
    setEditingId(item.id); setFormError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unitPrice) { setFormError('שם ומחיר הם שדות חובה'); return; }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      const body: any = {
        name: form.name, category: form.category,
        quantity: parseInt(form.quantity), minQuantity: parseInt(form.minQuantity),
        unitPrice: parseFloat(form.unitPrice),
      };
      if (form.sku) body.sku = form.sku;
      if (form.costPrice) body.costPrice = parseFloat(form.costPrice);
      if (form.expiryDate) body.expiryDate = form.expiryDate;

      if (editingId) {
        await apiFetch(`/inventory/${editingId}`, { method: 'PATCH', token: token || undefined, body: JSON.stringify(body) });
      } else {
        await apiFetch('/inventory', { method: 'POST', token: token || undefined, body: JSON.stringify(body) });
      }
      setShowForm(false); fetchItems();
    } catch (err: any) { setFormError(err.message || 'שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את הפריט?')) return;
    try { const token = getToken(); await apiFetch(`/inventory/${id}`, { method: 'DELETE', token: token || undefined }); fetchItems(); } catch { /* */ }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">מלאי</h1>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowStockCount} פריטים במלאי נמוך
            </span>
          )}
        </div>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />פריט חדש</Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editingId ? 'עריכת פריט' : 'פריט חדש'}</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>שם *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>מק&quot;ט</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>כמות</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>כמות מינימלית</Label><Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>מחיר מכירה (₪) *</Label><Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>מחיר עלות (₪)</Label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} dir="ltr" /></div>
              <div className="col-span-2 space-y-2"><Label>תאריך תפוגה</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="חיפוש לפי שם או מק&quot;ט..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">כל הקטגוריות</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="py-8 text-center text-muted-foreground">טוען...</div>
          : filtered.length === 0 ? <div className="py-8 text-center text-muted-foreground">{search ? 'לא נמצאו תוצאות' : 'אין פריטים במלאי'}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b text-right">
                  <th className="pb-3 font-medium text-muted-foreground">שם</th>
                  <th className="pb-3 font-medium text-muted-foreground">קטגוריה</th>
                  <th className="pb-3 font-medium text-muted-foreground">כמות</th>
                  <th className="pb-3 font-medium text-muted-foreground">מחיר</th>
                  <th className="pb-3 font-medium text-muted-foreground">תפוגה</th>
                  <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                </tr></thead>
                <tbody>
                  {filtered.map((item) => {
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3">{categoryLabels[item.category] || item.category}</td>
                        <td className="py-3">
                          <span className={isLow ? 'font-bold text-red-600' : ''}>
                            {item.quantity}
                          </span>
                          {isLow && <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-red-500" />}
                        </td>
                        <td className="py-3" dir="ltr">₪{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('he-IL') : '—'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="עריכה"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title="מחיקה"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
