'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, PawPrint, Package, AlertTriangle, Clock } from 'lucide-react';
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

export default function DashboardPage() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              תורים קרובים היום
            </CardTitle>
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
                    <div>
                      <div className="font-medium">
                        {appt.animal?.name} — {appt.client?.firstName} {appt.client?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{appt.type}</div>
                    </div>
                    <div className="text-sm" dir="ltr">
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
