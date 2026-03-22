'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface Summary {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidAmount: number;
  topServices: { description: string; revenue: number; count: number }[];
}

interface MonthlyRevenue {
  month: number;
  revenue: number;
}

interface PnLData {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  months: { month: number; revenue: number; expenses: number; profit: number }[];
}

interface ExpenseData {
  totalInventoryCost: number;
  byCategory: { category: string; cost: number }[];
}

interface ExportRow {
  invoiceNumber: string;
  clientName: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  issuedAt: string;
  items: string;
}

const monthNames = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const categoryLabels: Record<string, string> = {
  medication: 'תרופות',
  food: 'מזון',
  equipment: 'ציוד',
  supplies: 'חומרים מתכלים',
  other: 'אחר',
};

type TabType = 'overview' | 'pnl' | 'expenses';

export default function FinancePage() {
  const [tab, setTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const dateParams = [
        dateFrom ? `dateFrom=${dateFrom}` : '',
        dateTo ? `dateTo=${dateTo}` : '',
      ].filter(Boolean).join('&');
      const qs = dateParams ? `?${dateParams}` : '';

      try {
        const [sum, rev, pnlData, expData] = await Promise.all([
          apiFetch<Summary>(`/finance/summary${qs}`, { token }).catch(() => null),
          apiFetch<MonthlyRevenue[]>(`/finance/revenue-by-month?year=${year}`, { token }).catch(() => []),
          apiFetch<PnLData>(`/finance/profit-and-loss?year=${year}`, { token }).catch(() => null),
          apiFetch<ExpenseData>(`/finance/expenses${qs}`, { token }).catch(() => null),
        ]);
        if (sum) setSummary(sum);
        setMonthly(rev);
        if (pnlData) setPnl(pnlData);
        if (expData) setExpenses(expData);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [year, dateFrom, dateTo]);

  const maxMonthly = Math.max(...monthly.map((m) => m.revenue), 1);

  const exportToExcel = async () => {
    const token = getToken();
    if (!token) return;

    const dateParams = [
      dateFrom ? `dateFrom=${dateFrom}` : '',
      dateTo ? `dateTo=${dateTo}` : '',
    ].filter(Boolean).join('&');
    const qs = dateParams ? `?${dateParams}` : '';

    try {
      const data = await apiFetch<ExportRow[]>(`/finance/export${qs}`, { token });
      const ws = XLSX.utils.json_to_sheet(data.map((row) => ({
        'מספר חשבונית': row.invoiceNumber,
        'לקוח': row.clientName,
        'סטטוס': row.status,
        'סכום לפני מע"מ': row.subtotal,
        'מע"מ': row.taxAmount,
        'סה"כ': row.total,
        'שולם': row.paidAmount,
        'אמצעי תשלום': row.paymentMethod,
        'תאריך': row.issuedAt,
        'פריטים': row.items,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'חשבוניות');
      XLSX.writeFile(wb, `vetflow-finance-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch { /* */ }
  };

  const exportToPdf = async () => {
    const element = contentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('VetFlow - דוח פיננסי', pageWidth - margin, 20, { align: 'right' });

      // Date
      const today = new Date().toISOString().split('T')[0];
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(today, pageWidth - margin, 28, { align: 'right' });

      // Content image
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const startY = 35;

      if (imgHeight <= pageHeight - startY - margin) {
        pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, imgHeight);
      } else {
        // Multi-page: slice the canvas across pages
        const availableHeight = pageHeight - startY - margin;
        const firstPageAvailable = availableHeight;
        const subsequentAvailable = pageHeight - margin * 2;
        const pixelsPerMm = canvas.width / imgWidth;

        let srcY = 0;
        let isFirstPage = true;

        while (srcY < canvas.height) {
          const sliceHeightMm = isFirstPage ? firstPageAvailable : subsequentAvailable;
          const sliceHeightPx = Math.min(sliceHeightMm * pixelsPerMm, canvas.height - srcY);

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
            const sliceImg = sliceCanvas.toDataURL('image/png');
            const sliceRenderHeight = (sliceHeightPx / canvas.width) * imgWidth;
            const yPos = isFirstPage ? startY : margin;
            pdf.addImage(sliceImg, 'PNG', margin, yPos, imgWidth, sliceRenderHeight);
          }

          srcY += sliceHeightPx;
          if (srcY < canvas.height) {
            pdf.addPage();
          }
          isFirstPage = false;
        }
      }

      pdf.save(`vetflow-finance-report-${today}.pdf`);
    } catch { /* */ }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'סקירה' },
    { key: 'pnl', label: 'רווח והפסד' },
    { key: 'expenses', label: 'הוצאות' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">פיננסי</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToPdf}>
            <FileText className="ml-2 h-4 w-4" />ייצוא PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="ml-2 h-4 w-4" />ייצוא Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            {year - 1}
          </Button>
          <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)} disabled={year >= new Date().getFullYear()}>
            {year + 1}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4 flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">מתאריך</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">עד תאריך</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" dir="ltr" />
        </div>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            נקה סינון
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div ref={contentRef}>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">טוען...</div>
      ) : (
        <>
          {tab === 'overview' && (
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

              {/* Monthly Revenue Chart + Top Services */}
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
                          const value = data?.revenue || 0;
                          const width = maxMonthly > 0 ? (value / maxMonthly) * 100 : 0;
                          return (
                            <div key={month} className="flex items-center gap-3">
                              <span className="w-16 text-left text-xs text-muted-foreground">{monthNames[month - 1]}</span>
                              <div className="flex-1">
                                <div className="h-6 rounded bg-blue-500 transition-all" style={{ width: `${Math.max(width, 0.5)}%` }} />
                              </div>
                              <span className="w-24 text-left text-xs font-medium" dir="ltr">₪{value.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                            <div className="font-medium" dir="ltr">₪{service.revenue.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {tab === 'pnl' && pnl && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">סה"כ הכנסות</div>
                    <div className="text-2xl font-bold text-green-600" dir="ltr">₪{pnl.totalRevenue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">סה"כ הוצאות</div>
                    <div className="text-2xl font-bold text-red-600" dir="ltr">₪{pnl.totalExpenses.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">רווח נקי</div>
                    <div className={`text-2xl font-bold ${pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                      ₪{pnl.netProfit.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>רווח והפסד חודשי — {year}</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-right">
                          <th className="pb-2 pr-4">חודש</th>
                          <th className="pb-2 pr-4">הכנסות</th>
                          <th className="pb-2 pr-4">הוצאות</th>
                          <th className="pb-2 pr-4">רווח</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnl.months.map((m) => (
                          <tr key={m.month} className="border-b">
                            <td className="py-2 pr-4">{monthNames[m.month - 1]}</td>
                            <td className="py-2 pr-4 text-green-600" dir="ltr">₪{m.revenue.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-red-600" dir="ltr">₪{m.expenses.toLocaleString()}</td>
                            <td className={`py-2 pr-4 font-medium ${m.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                              ₪{m.profit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {tab === 'expenses' && expenses && (
            <>
              <div className="mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">סה"כ עלות מלאי</div>
                    <div className="text-2xl font-bold text-red-600" dir="ltr">₪{expenses.totalInventoryCost.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>הוצאות לפי קטגוריה</CardTitle></CardHeader>
                <CardContent>
                  {expenses.byCategory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">אין נתונים</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.byCategory.map((cat, i) => {
                        const maxCost = Math.max(...expenses.byCategory.map((c) => c.cost), 1);
                        const width = (cat.cost / maxCost) * 100;
                        return (
                          <div key={i}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>{categoryLabels[cat.category] || cat.category}</span>
                              <span dir="ltr">₪{cat.cost.toLocaleString()}</span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-gray-100">
                              <div className="h-4 rounded-full bg-red-400 transition-all" style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}
