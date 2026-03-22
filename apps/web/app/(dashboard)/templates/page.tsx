'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Clock,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

// ── Types ────────────────────────────────────────────────────────────────

interface TemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface TreatmentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  items: TemplateItem[];
  duration?: number;
}

type TemplateType = 'vaccination' | 'surgery' | 'checkup' | 'dental' | 'grooming' | 'other';

// ── Constants ────────────────────────────────────────────────────────────

const typeLabels: Record<TemplateType, string> = {
  vaccination: 'חיסון',
  surgery: 'ניתוח',
  checkup: 'בדיקה',
  dental: 'טיפול שיניים',
  grooming: 'טיפוח',
  other: 'אחר',
};

const typeColors: Record<TemplateType, string> = {
  vaccination: 'bg-blue-100 text-blue-700',
  surgery: 'bg-red-100 text-red-700',
  checkup: 'bg-green-100 text-green-700',
  dental: 'bg-purple-100 text-purple-700',
  grooming: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-600',
};

const emptyItem: TemplateItem = { description: '', quantity: 1, unitPrice: 0 };

interface FormState {
  name: string;
  type: TemplateType;
  description: string;
  duration: string;
  items: TemplateItem[];
}

const emptyForm: FormState = {
  name: '',
  type: 'checkup',
  description: '',
  duration: '',
  items: [{ ...emptyItem }],
};

// ── Component ────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TreatmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });

  // delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await apiFetch<TreatmentTemplate[]>('/treatment-templates', { token });
      setTemplates(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Helpers ────────────────────────────────────────────────────────────

  const itemTotal = (item: TemplateItem) => item.quantity * item.unitPrice;
  const grandTotal = (items: TemplateItem[]) =>
    items.reduce((sum, i) => sum + itemTotal(i), 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n);

  // ── Open modal ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, items: [{ ...emptyItem }] });
    setModalOpen(true);
  };

  const openEdit = (t: TreatmentTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      type: (t.type as TemplateType) || 'other',
      description: t.description || '',
      duration: t.duration != null ? String(t.duration) : '',
      items: t.items.length > 0 ? t.items.map((i) => ({ ...i })) : [{ ...emptyItem }],
    });
    setModalOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        description: form.description || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        items: form.items
          .filter((i) => i.description.trim() !== '')
          .map((i) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
      };

      if (editingId) {
        await apiFetch(`/treatment-templates/${editingId}`, {
          token,
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/treatment-templates', {
          token,
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      setModalOpen(false);
      await fetchTemplates();
    } catch {
      /* TODO: toast */
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const token = getToken();
    if (!token || !deleteId) return;
    try {
      await apiFetch(`/treatment-templates/${deleteId}`, { token, method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeleteId(null);
      await fetchTemplates();
    } catch {
      /* TODO: toast */
    }
  };

  // ── Items management ───────────────────────────────────────────────────

  const updateItem = (index: number, field: keyof TemplateItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyItem }] };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">תבניות טיפול</h1>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          תבנית חדשה
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">אין תבניות טיפול</p>
            <p className="mt-1 text-sm text-muted-foreground">
              צור תבנית טיפול ראשונה כדי לחסוך זמן בהזנת טיפולים חוזרים
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="ml-2 h-4 w-4" />
              תבנית חדשה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const total = grandTotal(t.items);
            const typeKey = (t.type as TemplateType) || 'other';
            return (
              <Card key={t.id} className="transition hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          typeColors[typeKey] || typeColors.other
                        }`}
                      >
                        {typeLabels[typeKey] || typeLabels.other}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => confirmDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {t.description && (
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.items.length} פריטים
                    </span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  {t.duration != null && t.duration > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{t.duration} דקות</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת תבנית' : 'תבנית חדשה'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'ערוך את פרטי התבנית' : 'מלא את פרטי התבנית החדשה'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="tpl-name">שם התבנית *</Label>
              <Input
                id="tpl-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="לדוגמה: חיסון כלבת שנתי"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label>סוג</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as TemplateType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabels) as TemplateType[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {typeLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="tpl-desc">תיאור</Label>
              <Textarea
                id="tpl-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="תיאור קצר של התבנית..."
                rows={2}
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <Label htmlFor="tpl-dur">משך (דקות)</Label>
              <Input
                id="tpl-dur"
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="30"
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>פריטים</Label>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-end gap-2 rounded-lg border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">תיאור</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="תיאור הפריט"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">כמות</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">מחיר ליחידה</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24 text-left text-sm font-medium">
                      {formatCurrency(itemTotal(item))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeItem(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="ml-1 h-4 w-4" />
                הוסף פריט
              </Button>

              {/* Total */}
              <div className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium">
                <span>סה״כ</span>
                <span>{formatCurrency(grandTotal(form.items))}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'שומר...' : editingId ? 'עדכון' : 'יצירה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת תבנית</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק תבנית זו? פעולה זו אינה הפיכה.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
