'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  Building2,
  Users,
  ListChecks,
  PartyPopper,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface WorkingHoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

type WorkingHours = Record<string, WorkingHoursEntry>;

interface TeamMember {
  name: string;
  email: string;
  role: string;
  phone: string;
}

interface ServiceItem {
  name: string;
  price: number;
}

const DAYS = [
  { key: 'sunday', label: 'ראשון' },
  { key: 'monday', label: 'שני' },
  { key: 'tuesday', label: 'שלישי' },
  { key: 'wednesday', label: 'רביעי' },
  { key: 'thursday', label: 'חמישי' },
  { key: 'friday', label: 'שישי' },
  { key: 'saturday', label: 'שבת' },
];

const DEFAULT_WORKING_HOURS: WorkingHours = {
  sunday: { open: '08:00', close: '18:00', closed: false },
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '13:00', closed: false },
  saturday: { open: '08:00', close: '18:00', closed: true },
};

const DEFAULT_SERVICES: ServiceItem[] = [
  { name: 'בדיקה כללית', price: 150 },
  { name: 'חיסון', price: 100 },
  { name: 'עיקור/סירוס', price: 800 },
  { name: 'ניקוי שיניים', price: 400 },
  { name: 'בדיקת דם', price: 200 },
];

const ROLE_OPTIONS = [
  { value: 'veterinarian', label: 'וטרינר' },
  { value: 'technician', label: 'טכנאי' },
  { value: 'receptionist', label: 'מזכירות' },
];

const STEPS = [
  { label: 'פרטי קליניקה', icon: Building2 },
  { label: 'צוות', icon: Users },
  { label: 'מחירון', icon: ListChecks },
  { label: 'סיום', icon: PartyPopper },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Clinic details
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  // Step 2 — Team
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Step 3 — Services
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);

  // Summary counters for step 4
  const [savedEmployees, setSavedEmployees] = useState(0);

  // Pre-fill clinic name from tenant on mount
  useEffect(() => {
    async function fetchTenant() {
      try {
        const token = getToken();
        const tenant = await apiFetch<any>('/tenants/current', { token: token || undefined });
        if (tenant.name) setClinicName(tenant.name);
        if (tenant.phone) setClinicPhone(tenant.phone);
        if (tenant.address) setClinicAddress(tenant.address);
        if (tenant.email) setClinicEmail(tenant.email);
      } catch {
        // ignore — defaults are fine
      }
    }
    fetchTenant();
  }, []);

  /* ---- helpers ---- */

  const updateWorkingDay = (dayKey: string, field: keyof WorkingHoursEntry, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const addTeamMember = () => {
    setTeam([...team, { name: '', email: '', role: 'veterinarian', phone: '' }]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeam((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const removeTeamMember = (index: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== index));
  };

  const addService = () => {
    setServices([...services, { name: '', price: 0 }]);
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string | number) => {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---- step transitions ---- */

  const handleNext = async () => {
    setError('');
    setSaving(true);

    try {
      const token = getToken();

      if (step === 0) {
        // Save clinic details + working hours
        if (!clinicName.trim()) {
          setError('שם הקליניקה הוא שדה חובה');
          setSaving(false);
          return;
        }
        await apiFetch('/tenants/current', {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify({
            name: clinicName,
            phone: clinicPhone || undefined,
            address: clinicAddress || undefined,
            settings: { workingHours },
          }),
        });
        setStep(1);
      } else if (step === 1) {
        // Create employees
        let created = 0;
        for (const member of team) {
          if (!member.name || !member.email) continue;
          try {
            await apiFetch('/employees', {
              method: 'POST',
              token: token || undefined,
              body: JSON.stringify({
                name: member.name,
                email: member.email,
                role: member.role,
                phone: member.phone || undefined,
                password: 'changeme123',
              }),
            });
            created++;
          } catch {
            // continue with rest
          }
        }
        setSavedEmployees(created);
        setStep(2);
      } else if (step === 2) {
        // Save services to tenant settings
        const validServices = services.filter((s) => s.name.trim());
        await apiFetch('/tenants/current', {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify({
            settings: { services: validServices },
          }),
        });
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה, נסו שוב');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  /* ---- render ---- */

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* ---- Progress indicator ---- */}
      <div className="mb-10 flex items-center justify-center gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 ${
                    isDone ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDone
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    isActive ? 'font-semibold text-blue-700' : isDone ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* ================================================================ */}
      {/*  Step 1 — Clinic details                                         */}
      {/* ================================================================ */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי קליניקה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>שם הקליניקה *</Label>
                <Input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="לדוגמה: מרפאה וטרינרית שמש"
                />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>כתובת</Label>
                <Input
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="רחוב, עיר"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                  placeholder="clinic@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Working hours */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">שעות פעילות</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-2 font-medium text-muted-foreground">יום</th>
                      <th className="pb-2 font-medium text-muted-foreground">סטטוס</th>
                      <th className="pb-2 font-medium text-muted-foreground">פתיחה</th>
                      <th className="pb-2 font-medium text-muted-foreground">סגירה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => {
                      const entry = workingHours[day.key];
                      return (
                        <tr key={day.key} className="border-b last:border-0">
                          <td className="py-2 font-medium">{day.label}</td>
                          <td className="py-2">
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={!entry.closed}
                                onChange={(e) => updateWorkingDay(day.key, 'closed', !e.target.checked)}
                                className="peer sr-only"
                              />
                              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                              <span className="mr-2 text-xs text-muted-foreground">
                                {entry.closed ? 'סגור' : 'פתוח'}
                              </span>
                            </label>
                          </td>
                          <td className="py-2">
                            <Input
                              type="time"
                              value={entry.open}
                              onChange={(e) => updateWorkingDay(day.key, 'open', e.target.value)}
                              disabled={entry.closed}
                              className="w-28"
                              dir="ltr"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="time"
                              value={entry.close}
                              onChange={(e) => updateWorkingDay(day.key, 'close', e.target.value)}
                              disabled={entry.closed}
                              className="w-28"
                              dir="ltr"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/*  Step 2 — Team                                                   */}
      {/* ================================================================ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              צוות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              הוסיפו את חברי הצוות שיעבדו במערכת. ניתן לדלג ולהוסיף מאוחר יותר.
            </p>

            {team.map((member, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border bg-gray-50/50 p-4"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-2 h-7 w-7 text-red-400 hover:text-red-600"
                  onClick={() => removeTeamMember(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">שם מלא *</Label>
                    <Input
                      value={member.name}
                      onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                      placeholder="ד״ר ישראל ישראלי"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">אימייל *</Label>
                    <Input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateTeamMember(idx, 'email', e.target.value)}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">תפקיד</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={member.role}
                      onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">טלפון</Label>
                    <Input
                      value={member.phone}
                      onChange={(e) => updateTeamMember(idx, 'phone', e.target.value)}
                      placeholder="050-0000000"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addTeamMember} className="w-full">
              <Plus className="ml-2 h-4 w-4" />
              הוספת חבר צוות
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/*  Step 3 — Price list                                             */}
      {/* ================================================================ */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              מחירון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              הגדירו את השירותים והמחירים של הקליניקה. ניתן לערוך ולהוסיף בכל עת.
            </p>

            {services.map((svc, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Input
                    value={svc.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    placeholder="שם השירות"
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Input
                    type="number"
                    value={svc.price}
                    onChange={(e) => updateService(idx, 'price', Number(e.target.value))}
                    placeholder="מחיר"
                    dir="ltr"
                    min={0}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-400 hover:text-red-600"
                  onClick={() => removeService(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addService} className="w-full">
              <Plus className="ml-2 h-4 w-4" />
              הוספת שירות
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/*  Step 4 — Done                                                   */}
      {/* ================================================================ */}
      {step === 3 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h2 className="mb-2 text-2xl font-bold">הקליניקה מוכנה!</h2>
            <p className="mb-6 text-muted-foreground">ההגדרות הראשוניות הושלמו בהצלחה</p>

            <div className="mx-auto mb-8 max-w-xs space-y-2 text-sm text-right">
              <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2">
                <span className="text-muted-foreground">קליניקה</span>
                <span className="font-medium">{clinicName}</span>
              </div>
              {savedEmployees > 0 && (
                <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2">
                  <span className="text-muted-foreground">חברי צוות</span>
                  <span className="font-medium">{savedEmployees}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2">
                <span className="text-muted-foreground">שירותים במחירון</span>
                <span className="font-medium">{services.filter((s) => s.name.trim()).length}</span>
              </div>
            </div>

            <Button size="lg" onClick={() => router.push('/dashboard')}>
              למערכת
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Navigation buttons ---- */}
      {step < 3 && (
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                <ArrowRight className="ml-2 h-4 w-4" />
                הקודם
              </Button>
            )}
          </div>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? 'שומר...' : 'הבא'}
            {!saving && <ArrowLeft className="mr-2 h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
