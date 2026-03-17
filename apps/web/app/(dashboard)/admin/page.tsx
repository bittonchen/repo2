'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, PawPrint, Calendar, Receipt, Package, Bell,
  TrendingUp, TrendingDown, Minus, AlertTriangle, UserCog, Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface AdminDashboard {
  counts: {
    clients: number;
    animals: number;
    appointmentsToday: number;
    appointmentsWeek: number;
    appointmentsMonth: number;
    employees: number;
    invoices: number;
  };
  recentActivity: {
    id: string;
    startTime: string;
    type: string;
    status: string;
    client?: { firstName: string; lastName: string };
    animal?: { name: string };
    veterinarian?: { name: string };
  }[];
  employeePerformance: {
    id: string;
    name: string;
    role: string;
    appointmentCount: number;
    revenue: number;
  }[];
  lowStock: { id: string; name: string; quantity: number; minQuantity: number }[];
  pendingReminders: number;
  unconfirmedAppointments: number;
}

interface ClinicStats {
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  newAnimalsThisMonth: number;
  newAnimalsLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

function GrowthIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-4 w-4 text-gray-400" />;
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 100;
  if (pct > 0) return <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp className="h-3.5 w-3.5" />+{pct}%</span>;
  if (pct < 0) return <span className="flex items-center gap-1 text-xs text-red-600"><TrendingDown className="h-3.5 w-3.5" />{pct}%</span>;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

const statusLabels: Record<string, string> = {
  pending: 'ממתין', confirmed: 'אושר', in_progress: 'בטיפול',
  completed: 'הושלם', cancelled: 'בוטל', no_show: 'לא הגיע',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800', no_show: 'bg-red-100 text-red-800',
};
const roleLabels: Record<string, string> = {
  owner: 'בעלים', admin: 'מנהל', veterinarian: 'וטרינר', technician: 'טכנאי', receptionist: 'מזכירות',
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const [dash, st] = await Promise.all([
          apiFetch<AdminDashboard>('/admin/dashboard', { token }).catch(() => null),
          apiFetch<ClinicStats>('/admin/clinic-stats', { token }).catch(() => null),
        ]);
        if (dash) setDashboard(dash);
        if (st) setStats(st);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;

  const c = dashboard?.counts;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">דשבורד מנהל</h1>

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'לקוחות', value: c?.clients || 0, icon: Users, color: 'text-blue-600' },
          { label: 'חיות', value: c?.animals || 0, icon: PawPrint, color: 'text-purple-600' },
          { label: 'תורים היום', value: c?.appointmentsToday || 0, icon: Calendar, color: 'text-green-600' },
          { label: 'תורים השבוע', value: c?.appointmentsWeek || 0, icon: Calendar, color: 'text-teal-600' },
          { label: 'עובדים', value: c?.employees || 0, icon: UserCog, color: 'text-orange-600' },
          { label: 'חשבוניות', value: c?.invoices || 0, icon: Receipt, color: 'text-pink-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center pt-4 pb-3">
              <stat.icon className={`mb-1 h-6 w-6 ${stat.color}`} />
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Row */}
      {((dashboard?.unconfirmedAppointments || 0) > 0 || (dashboard?.pendingReminders || 0) > 0 || (dashboard?.lowStock?.length || 0) > 0) && (
        <div className="mb-8 flex flex-wrap gap-3">
          {(dashboard?.unconfirmedAppointments || 0) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              <Clock className="h-4 w-4" />{dashboard!.unconfirmedAppointments} תורים לא אושרו
            </div>
          )}
          {(dashboard?.pendingReminders || 0) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
              <Bell className="h-4 w-4" />{dashboard!.pendingReminders} תזכורות ממתינות
            </div>
          )}
          {(dashboard?.lowStock?.length || 0) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4" />{dashboard!.lowStock.length} פריטים במלאי נמוך
            </div>
          )}
        </div>
      )}

      {/* Growth Metrics */}
      {stats && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">מגמות חודשיות</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">לקוחות חדשים</div>
                    <div className="text-2xl font-bold">{stats.newClientsThisMonth}</div>
                  </div>
                  <GrowthIndicator current={stats.newClientsThisMonth} previous={stats.newClientsLastMonth} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">חודש קודם: {stats.newClientsLastMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">חיות חדשות</div>
                    <div className="text-2xl font-bold">{stats.newAnimalsThisMonth}</div>
                  </div>
                  <GrowthIndicator current={stats.newAnimalsThisMonth} previous={stats.newAnimalsLastMonth} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">חודש קודם: {stats.newAnimalsLastMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">הכנסות החודש</div>
                    <div className="text-2xl font-bold" dir="ltr">₪{stats.revenueThisMonth.toLocaleString()}</div>
                  </div>
                  <GrowthIndicator current={stats.revenueThisMonth} previous={stats.revenueLastMonth} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground" dir="ltr">חודש קודם: ₪{stats.revenueLastMonth.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Employee Performance */}
        <Card>
          <CardHeader><CardTitle>ביצועי עובדים (החודש)</CardTitle></CardHeader>
          <CardContent>
            {!dashboard?.employeePerformance?.length ? (
              <p className="text-sm text-muted-foreground">אין נתונים</p>
            ) : (
              <div className="space-y-3">
                {dashboard.employeePerformance.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{roleLabels[emp.role] || emp.role}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{emp.appointmentCount} תורים</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">₪{emp.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>פעילות אחרונה</CardTitle></CardHeader>
          <CardContent>
            {!dashboard?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground">אין פעילות</p>
            ) : (
              <div className="space-y-2">
                {dashboard.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b py-2 last:border-0">
                    <div>
                      <div className="text-sm font-medium">
                        {activity.animal?.name} — {activity.client?.firstName} {activity.client?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.type} • {activity.veterinarian?.name}</div>
                    </div>
                    <div className="text-left">
                      <span className={`rounded px-2 py-0.5 text-xs ${statusColors[activity.status] || ''}`}>
                        {statusLabels[activity.status] || activity.status}
                      </span>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(activity.startTime).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        {dashboard?.lowStock && dashboard.lowStock.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />מלאי נמוך</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard.lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                    <span className="text-sm font-medium text-red-800">{item.name}</span>
                    <span className="text-sm text-red-600">נשארו {item.quantity} (מינימום: {item.minQuantity})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
