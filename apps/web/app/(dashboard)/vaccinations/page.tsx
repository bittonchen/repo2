'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Syringe, PawPrint, AlertTriangle, CheckCircle, Clock, Cat, Dog, Bird, Rabbit,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface VaccinationRecord {
  animalId: string;
  animalName: string;
  species: string;
  clientName: string;
  lastVaccinationDate: string | null;
  nextDueDate: string | null;
  status: 'overdue' | 'upcoming' | 'completed';
}

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-4 w-4" />,
  cat: <Cat className="h-4 w-4" />,
  bird: <Bird className="h-4 w-4" />,
  rabbit: <Rabbit className="h-4 w-4" />,
};

const speciesLabels: Record<string, string> = {
  dog: 'כלב', cat: 'חתול', bird: 'ציפור', rabbit: 'ארנב',
  hamster: 'אוגר', reptile: 'זוחל', fish: 'דג', other: 'אחר',
};

const statusLabels: Record<string, string> = {
  overdue: 'באיחור',
  upcoming: 'קרוב',
  completed: 'בוצע',
};

const statusColors: Record<string, string> = {
  overdue: 'bg-red-100 text-red-800',
  upcoming: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

type FilterTab = 'all' | 'overdue' | 'upcoming' | 'completed';

function getDaysDiff(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function VaccinationsPage() {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    const fetchVaccinations = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await apiFetch<VaccinationRecord[]>('/medical-records/vaccinations', { token });
        setRecords(res);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchVaccinations();
  }, []);

  const overdueCount = records.filter((r) => r.status === 'overdue').length;
  const upcomingCount = records.filter((r) => r.status === 'upcoming').length;
  const completedCount = records.filter((r) => r.status === 'completed').length;

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  // Sort: overdue first, then upcoming, then completed
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { overdue: 0, upcoming: 1, completed: 2 };
    const orderDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
    if (orderDiff !== 0) return orderDiff;
    // Within same status, sort by next due date
    if (a.nextDueDate && b.nextDueDate) {
      return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
    }
    return 0;
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'overdue', label: 'באיחור' },
    { key: 'upcoming', label: 'קרוב' },
    { key: 'completed', label: 'בוצע' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Syringe className="h-6 w-6 text-blue-600" />
          מעקב חיסונים
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <PawPrint className="mb-2 h-8 w-8 text-blue-600" />
            <div className="text-2xl font-bold">{records.length}</div>
            <div className="text-xs text-muted-foreground">סה&quot;כ חיות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <AlertTriangle className="mb-2 h-8 w-8 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-xs text-muted-foreground">באיחור</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Clock className="mb-2 h-8 w-8 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">קרוב (30 יום)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <CheckCircle className="mb-2 h-8 w-8 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-muted-foreground">מעודכן</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex rounded-lg border">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.key ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">טוען...</div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            אין נתוני חיסונים להצגה
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-3 font-medium">חיה</th>
                    <th className="p-3 font-medium">סוג</th>
                    <th className="p-3 font-medium">בעלים</th>
                    <th className="p-3 font-medium">חיסון אחרון</th>
                    <th className="p-3 font-medium">חיסון הבא</th>
                    <th className="p-3 font-medium">סטטוס</th>
                    <th className="p-3 font-medium">ימים</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((record) => {
                    const daysDiff = getDaysDiff(record.nextDueDate);
                    return (
                      <tr key={record.animalId} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3">
                          <Link href={`/animals/${record.animalId}`} className="font-medium text-blue-600 hover:underline">
                            {record.animalName}
                          </Link>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {speciesIcons[record.species] || <PawPrint className="h-4 w-4" />}
                            <span>{speciesLabels[record.species] || record.species}</span>
                          </div>
                        </td>
                        <td className="p-3">{record.clientName}</td>
                        <td className="p-3">
                          {record.lastVaccinationDate
                            ? new Date(record.lastVaccinationDate).toLocaleDateString('he-IL')
                            : '—'}
                        </td>
                        <td className="p-3">
                          {record.nextDueDate
                            ? new Date(record.nextDueDate).toLocaleDateString('he-IL')
                            : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`rounded px-2 py-0.5 text-xs ${statusColors[record.status] || ''}`}>
                            {statusLabels[record.status] || record.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {daysDiff !== null ? (
                            <span className={`text-xs font-medium ${
                              daysDiff < 0 ? 'text-red-600' : daysDiff <= 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {daysDiff < 0
                                ? `${Math.abs(daysDiff)} ימים באיחור`
                                : daysDiff === 0
                                  ? 'היום'
                                  : `בעוד ${daysDiff} ימים`}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
