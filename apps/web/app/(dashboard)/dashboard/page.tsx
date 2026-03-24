'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Users,
  PawPrint,
  Package,
  AlertTriangle,
  Clock,
  UserPlus,
  Receipt,
  Stethoscope,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  client?: { firstName: string; lastName: string };
  animal?: { name: string };
  veterinarian?: { name: string };
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
}

interface ClientOption { id: string; firstName: string; lastName: string; }
interface AnimalOption { id: string; name: string; clientId: string; }
interface Vet { id: string; name: string; }

const statusLabels: Record<string, string> = {
  scheduled: 'מתוכנן',
  confirmed: 'מאושר',
  'in-progress': 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
  'no-show': 'לא הגיע',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-orange-100 text-orange-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ clientId: '', animalId: '', veterinarianId: '', type: '', notes: '' });
  const [visitClients, setVisitClients] = useState<ClientOption[]>([]);
  const [visitAnimals, setVisitAnimals] = useState<AnimalOption[]>([]);
  const [visitVets, setVisitVets] = useState<Vet[]>([]);
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitError, setVisitError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const [appts, clients, animals, stock] = await Promise.all([
          apiFetch<Appointment[]>(`/appointments?date=${today}`, { token }).catch(() => []),
          apiFetch<{ total: number }>('/clients?pageSize=1', { token }).catch(() => ({ total: 0 })),
          apiFetch<any[]>('/animals', { token }).catch(() => []),
          apiFetch<LowStockItem[]>('/inventory/low-stock', { token }).catch(() => []),
        ]);
        setTodayAppointments(appts);
        setClientCount(clients.total);
        setAnimalCount(animals.length);
        setLowStock(stock);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Fetch options for visit modal
  useEffect(() => {
    if (!showVisitModal) return;
    const fetchOptions = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const [clientsRes, animalsRes, vetsRes] = await Promise.all([
          apiFetch<{ data: ClientOption[] }>('/clients?pageSize=100', { token }).catch(() => ({ data: [] })),
          apiFetch<AnimalOption[]>('/animals', { token }).catch(() => []),
          apiFetch<any>('/employees?role=veterinarian', { token }).catch(() => ({ data: [] })),
        ]);
        setVisitClients(clientsRes.data);
        setVisitAnimals(animalsRes);
        const vetData = Array.isArray(vetsRes) ? vetsRes : vetsRes.data || [];
        setVisitVets(vetData);
      } catch { /* */ }
    };
    fetchOptions();
  }, [showVisitModal]);

  const visitClientAnimals = visitAnimals.filter((a) => a.clientId === visitForm.clientId);

  const handleVisitSave = async () => {
    if (!visitForm.clientId || !visitForm.animalId || !visitForm.veterinarianId || !visitForm.type) {
      setVisitError('כל השדות המסומנים הם חובה');
      return;
    }
    setVisitSaving(true);
    setVisitError('');
    try {
      const token = getToken();
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60 * 1000);
      const created = await apiFetch<{ id: string }>('/appointments', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          clientId: visitForm.clientId,
          animalId: visitForm.animalId,
          veterinarianId: visitForm.veterinarianId,
          type: visitForm.type,
          notes: visitForm.notes,
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });
      await apiFetch(`/appointments/${created.id}/status`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ status: 'in_progress' }),
      });
      setShowVisitModal(false);
      router.push(`/appointments/${created.id}`);
    } catch (err: any) {
      setVisitError(err.message || 'שגיאה ביצירת ביקור');
    } finally {
      setVisitSaving(false);
    }
  };

  const quickActions = [
    { label: 'ביקור חדש', onClick: () => { setVisitForm({ clientId: '', animalId: '', veterinarianId: '', type: '', notes: '' }); setVisitError(''); setShowVisitModal(true); }, icon: Stethoscope, color: 'text-emerald-600' },
    { label: 'תור חדש', href: '/appointments?new=1', icon: Calendar, color: 'text-blue-600' },
    { label: 'לקוח חדש', href: '/clients?new=1', icon: UserPlus, color: 'text-green-600' },
    { label: 'חשבונית חדשה', href: '/pos?new=1', icon: Receipt, color: 'text-purple-600' },
  ] as const;

  const upcomingAppts = todayAppointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const stats = [
    { title: 'תורים היום', value: todayAppointments.length, icon: Calendar, color: 'text-blue-600', href: '/appointments' },
    { title: 'לקוחות', value: clientCount, icon: Users, color: 'text-green-600', href: '/clients' },
    { title: 'חיות', value: animalCount, icon: PawPrint, color: 'text-purple-600', href: '/animals' },
    { title: 'מלאי נמוך', value: lowStock.length, icon: Package, color: lowStock.length > 0 ? 'text-red-600' : 'text-gray-400', href: '/inventory' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">דשבורד</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '—' : stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map((action) => {
          const cardContent = (
            <Card className="cursor-pointer transition hover:shadow-md hover:border-primary/30">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
                <action.icon className={`h-8 w-8 ${action.color}`} />
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          );
          if ('onClick' in action) {
            return <div key={action.label} onClick={action.onClick}>{cardContent}</div>;
          }
          return <Link key={action.label} href={action.href}>{cardContent}</Link>;
        })}
      </div>

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">ביקור חדש</h2>
            {visitError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{visitError}</div>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>לקוח *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visitForm.clientId} onChange={(e) => setVisitForm({ ...visitForm, clientId: e.target.value, animalId: '' })}>
                  <option value="">בחרו לקוח</option>
                  {visitClients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>חיה *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visitForm.animalId} onChange={(e) => setVisitForm({ ...visitForm, animalId: e.target.value })} disabled={!visitForm.clientId}>
                  <option value="">בחרו חיה</option>
                  {visitClientAnimals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>וטרינר *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visitForm.veterinarianId} onChange={(e) => setVisitForm({ ...visitForm, veterinarianId: e.target.value })}>
                  <option value="">בחרו וטרינר</option>
                  {visitVets.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>סוג ביקור *</Label>
                <Input value={visitForm.type} onChange={(e) => setVisitForm({ ...visitForm, type: e.target.value })} placeholder="ביקורת שגרתית, חיסון, ניתוח..." />
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowVisitModal(false)}>ביטול</Button>
              <Button onClick={handleVisitSave} disabled={visitSaving}>{visitSaving ? 'שומר...' : 'התחל ביקור'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments & Alerts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                תורים קרובים היום
              </CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="text-xs">
                  הצג הכל
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">טוען...</p>
            ) : upcomingAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין תורים קרובים היום</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appt.animal?.name} — {appt.client?.firstName} {appt.client?.lastName}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusColors[appt.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabels[appt.status] || appt.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{appt.type}</span>
                        {appt.veterinarian?.name && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>ד״ר {appt.veterinarian.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium" dir="ltr">
                      {new Date(appt.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              התראות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">טוען...</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין התראות חדשות</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                    <div className="text-sm font-medium text-red-800">{item.name}</div>
                    <div className="text-sm text-red-600">
                      נשארו {item.quantity} (מינימום: {item.min_quantity})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
