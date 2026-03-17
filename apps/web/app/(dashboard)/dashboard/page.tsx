'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, PawPrint, Receipt } from 'lucide-react';

const stats = [
  { title: 'תורים היום', value: '—', icon: Calendar, color: 'text-blue-600' },
  { title: 'לקוחות', value: '—', icon: Users, color: 'text-green-600' },
  { title: 'חיות', value: '—', icon: PawPrint, color: 'text-purple-600' },
  { title: 'הכנסות החודש', value: '—', icon: Receipt, color: 'text-orange-600' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">דשבורד</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>תורים קרובים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">אין תורים קרובים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>התראות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">אין התראות חדשות</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
