'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, FileText, Receipt } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Summary {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidAmount: number;
  topServices: { description: string; total: number; count: number }[];
}

interface MonthlyRevenue {
  month: number;
  total: number;
}

const monthNames = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      try {
        const [sum, rev] = await Promise.all([
          apiFetch<Summary>('/finance/summary', { token }).catch(() => null),
          apiFetch<MonthlyRevenue[]>(`/finance/revenue-by-month?year=${year}`, { token }).catch(() => []),
        ]);
        if (sum) setSummary(sum);
        setMonthly(rev);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [year]);

  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">פיננסי</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            {year - 1}
          </Button>
          <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)} disabled={year >= new Date().getFullYear()}>
            {year + 1}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">טוען...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-green-100 p-3"><DollarSign className="h-6 w-6 text-green-600" /></div>
                <div>
                  <div className="text-sm text-muted-foreground">הכנסות</div>
                  <div className="text-2xl font-bold" dir="ltr">₪{(summary?.totalRevenue || 0).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-blue-100 p-3"><FileText className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <div className="text-sm text-muted-foreground">חשבוניות</div>
                  <div className="text-2xl font-bold">{summary?.totalInvoices || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-green-100 p-3"><TrendingUp className="h-6 w-6 text-green-600" /></div>
                <div>
                  <div className="text-sm text-muted-foreground">שולמו</div>
                  <div className="text-2xl font-bold">{summary?.paidInvoices || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-red-100 p-3"><TrendingDown className="h-6 w-6 text-red-600" /></div>
                <div>
                  <div className="text-sm text-muted-foreground">חוב פתוח</div>
                  <div className="text-2xl font-bold" dir="ltr">₪{(summary?.unpaidAmount || 0).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>הכנסות חודשיות — {year}</CardTitle></CardHeader>
              <CardContent>
                {monthly.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">אין נתונים לשנה זו</p>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const data = monthly.find((m) => m.month === month);
                      const value = data?.total || 0;
                      const width = maxMonthly > 0 ? (value / maxMonthly) * 100 : 0;
                      return (
                        <div key={month} className="flex items-center gap-3">
                          <span className="w-16 text-left text-xs text-muted-foreground">{monthNames[month - 1]}</span>
                          <div className="flex-1">
                            <div
                              className="h-6 rounded bg-blue-500 transition-all"
                              style={{ width: `${Math.max(width, 0.5)}%` }}
                            />
                          </div>
                          <span className="w-24 text-left text-xs font-medium" dir="ltr">
                            ₪{value.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader><CardTitle>שירותים מובילים</CardTitle></CardHeader>
              <CardContent>
                {!summary?.topServices || summary.topServices.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">אין נתונים</p>
                ) : (
                  <div className="space-y-3">
                    {summary.topServices.map((service, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="font-medium">{service.description}</div>
                          <div className="text-xs text-muted-foreground">{service.count} פעמים</div>
                        </div>
                        <div className="font-medium" dir="ltr">₪{service.total.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
