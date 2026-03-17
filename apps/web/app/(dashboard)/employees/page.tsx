'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Employee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

const roleLabels: Record<string, string> = {
  owner: 'בעלים', admin: 'מנהל', veterinarian: 'וטרינר',
  technician: 'טכנאי', receptionist: 'מזכירות',
};

const emptyForm = {
  email: '', password: '', name: '', phone: '', role: 'receptionist',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await apiFetch<any>('/employees', { token: token || undefined });
      setEmployees(Array.isArray(res) ? res : res.data || []);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormError(''); setShowForm(true); };

  const openEdit = (emp: Employee) => {
    setForm({ email: emp.email, password: '', name: emp.name, phone: emp.phone || '', role: emp.role });
    setEditingId(emp.id); setFormError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editingId && !form.password)) {
      setFormError('שם, אימייל וסיסמה הם שדות חובה');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const token = getToken();
      const body: any = { name: form.name, email: form.email, role: form.role };
      if (form.phone) body.phone = form.phone;
      if (form.password) body.password = form.password;

      if (editingId) {
        await apiFetch(`/employees/${editingId}`, { method: 'PATCH', token: token || undefined, body: JSON.stringify(body) });
      } else {
        await apiFetch('/employees', { method: 'POST', token: token || undefined, body: JSON.stringify(body) });
      }
      setShowForm(false); fetchEmployees();
    } catch (err: any) { setFormError(err.message || 'שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const action = isActive ? 'להשבית' : 'להפעיל';
    if (!confirm(`האם ${action} את העובד?`)) return;
    try {
      const token = getToken();
      if (isActive) {
        await apiFetch(`/employees/${id}`, { method: 'DELETE', token: token || undefined });
      } else {
        await apiFetch(`/employees/${id}`, { method: 'PATCH', token: token || undefined, body: JSON.stringify({ isActive: true }) });
      }
      fetchEmployees();
    } catch { /* */ }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">עובדים</h1>
        <Button onClick={openCreate}><Plus className="ml-2 h-4 w-4" />עובד חדש</Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editingId ? 'עריכת עובד' : 'עובד חדש'}</h2>
            {formError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>שם מלא *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>אימייל *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2">
                <Label>{editingId ? 'סיסמה חדשה' : 'סיסמה *'}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" placeholder={editingId ? 'השאירו ריק ללא שינוי' : ''} />
              </div>
              <div className="space-y-2"><Label>טלפון</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2">
                <Label>תפקיד</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {Object.entries(roleLabels).filter(([k]) => k !== 'owner').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">טוען...</div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">אין עובדים. הוסיפו עובד חדש!</div>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className={!emp.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{emp.name}</h3>
                    <p className="text-sm text-muted-foreground" dir="ltr">{emp.email}</p>
                    {emp.phone && <p className="text-sm text-muted-foreground" dir="ltr">{emp.phone}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    emp.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                    emp.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    emp.role === 'veterinarian' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {roleLabels[emp.role] || emp.role}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs ${emp.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {emp.isActive ? 'פעיל' : 'מושבת'}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="עריכה">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {emp.role !== 'owner' && (
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(emp.id, emp.isActive)} title={emp.isActive ? 'השבתה' : 'הפעלה'}>
                        {emp.isActive ? <UserX className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
