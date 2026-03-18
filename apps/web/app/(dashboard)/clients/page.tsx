'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, PawPrint } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  notes?: string;
  animals?: { id: string; name: string }[];
}

interface ClientsResponse {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  idNumber: '',
  notes: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      const res = await apiFetch<ClientsResponse>(`/clients?${params}`, { token: token || undefined });
      setClients(res.data);
      setTotal(res.total);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      idNumber: client.idNumber || '',
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      setFormError('שם פרטי, שם משפחה וטלפון הם שדות חובה');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const token = getToken();
      const body: any = { ...form };
      // Remove empty optional fields
      if (!body.email) delete body.email;
      if (!body.address) delete body.address;
      if (!body.idNumber) delete body.idNumber;
      if (!body.notes) delete body.notes;

      if (editingId) {
        await apiFetch(`/clients/${editingId}`, {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/clients', {
          method: 'POST',
          token: token || undefined,
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את הלקוח?')) return;
    try {
      const token = getToken();
      await apiFetch(`/clients/${id}`, { method: 'DELETE', token: token || undefined });
      fetchClients();
    } catch {
      // handle silently
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          לקוח חדש
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              {editingId ? 'עריכת לקוח' : 'לקוח חדש'}
            </h2>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם פרטי *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>שם משפחה *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>טלפון *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>תעודת זהות</Label>
                <Input
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>הערות</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                ביטול
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'שומר...' : 'שמירה'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם, טלפון או אימייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">טוען...</div>
          ) : clients.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search ? 'לא נמצאו תוצאות' : 'אין לקוחות עדיין. הוסיפו את הלקוח הראשון!'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 font-medium text-muted-foreground">שם</th>
                      <th className="pb-3 font-medium text-muted-foreground">טלפון</th>
                      <th className="pb-3 font-medium text-muted-foreground">אימייל</th>
                      <th className="pb-3 font-medium text-muted-foreground">חיות</th>
                      <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                            {client.firstName} {client.lastName}
                          </Link>
                        </td>
                        <td className="py-3" dir="ltr">{client.phone}</td>
                        <td className="py-3" dir="ltr">{client.email || '—'}</td>
                        <td className="py-3">
                          {client.animals && client.animals.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <PawPrint className="h-3.5 w-3.5 text-purple-500" />
                              <span>{client.animals.length}</span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(client)}
                              title="עריכה"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id)}
                              title="מחיקה"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    הקודם
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    עמוד {page} מתוך {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    הבא
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
