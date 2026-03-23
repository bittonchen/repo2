'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import {
  Stethoscope,
  Syringe,
  Scissors,
  Sparkles,
  AlertTriangle,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from 'lucide-react';

// --- Types ---

interface ClinicInfo {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  appointmentDuration: number;
  visitTypes: { key: string; label: string }[];
}

interface Veterinarian {
  id: string;
  name: string;
}

const VISIT_TYPE_ICONS: Record<string, typeof Stethoscope> = {
  checkup: Stethoscope,
  vaccination: Syringe,
  surgery: Scissors,
  dental: Sparkles,
  emergency: AlertTriangle,
  other: MoreHorizontal,
};

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'כלב' },
  { value: 'cat', label: 'חתול' },
  { value: 'bird', label: 'ציפור' },
  { value: 'rabbit', label: 'ארנב' },
  { value: 'hamster', label: 'אוגר' },
  { value: 'reptile', label: 'זוחל' },
  { value: 'fish', label: 'דג' },
  { value: 'other', label: 'אחר' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'זכר' },
  { value: 'female', label: 'נקבה' },
  { value: 'unknown', label: 'לא ידוע' },
];

const STEPS = ['סוג ביקור', 'בחירת וטרינר', 'תאריך ושעה', 'פרטי לקוח', 'סיכום'];

// --- Component ---

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Selections
  const [selectedType, setSelectedType] = useState('');
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    animalName: '',
    species: 'dog',
    breed: '',
    gender: 'unknown',
  });

  // Load clinic info
  useEffect(() => {
    async function load() {
      try {
        const info = await apiFetch<ClinicInfo>(`/booking/${slug}`);
        setClinic(info);
      } catch (err: any) {
        setError(err.message || 'Failed to load clinic info');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Load vets when reaching step 1
  useEffect(() => {
    if (step === 1 && vets.length === 0) {
      apiFetch<Veterinarian[]>(`/booking/${slug}/veterinarians`)
        .then(setVets)
        .catch(() => setError('Failed to load veterinarians'));
    }
  }, [step, slug, vets.length]);

  // Load slots when date or vet changes
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedVet) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    try {
      const result = await apiFetch<string[]>(
        `/booking/${slug}/slots?date=${selectedDate}&veterinarianId=${selectedVet}`,
      );
      setSlots(result);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, selectedVet, slug]);

  useEffect(() => {
    if (step === 2) loadSlots();
  }, [step, selectedDate, selectedVet, loadSlots]);

  // Set default date to today when entering step 2
  useEffect(() => {
    if (step === 2 && !selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [step, selectedDate]);

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedType;
      case 1: return !!selectedVet;
      case 2: return !!selectedSlot;
      case 3:
        return !!(form.firstName && form.lastName && form.phone && form.animalName);
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await apiFetch<any>(`/booking/${slug}/book`, {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          startTime: selectedSlot,
          veterinarianId: selectedVet,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email || undefined,
          animalName: form.animalName,
          species: form.species,
          breed: form.breed || undefined,
          gender: form.gender,
        }),
      });

      const searchParams = new URLSearchParams({
        clinicName: result.clinicName || '',
        clinicAddress: result.clinicAddress || '',
        type: selectedType,
        veterinarian: result.veterinarian?.name || '',
        startTime: result.startTime,
        animalName: form.animalName,
        clientName: `${form.firstName} ${form.lastName}`,
      });

      router.push(`/book/${slug}/success?${searchParams.toString()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      setSubmitting(false);
    }
  };

  // --- Calendar helpers ---
  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (number | null)[] = [];

    // Pad start (week starts on Sunday)
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  };

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const monthDays = getMonthDays(calYear, calMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = new Date(calYear, calMonth).toLocaleDateString('he-IL', {
    month: 'long',
    year: 'numeric',
  });

  const goNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };
  const goPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const selectedVetName = vets.find((v) => v.id === selectedVet)?.name || '';

  // --- Render ---

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-xl font-bold">שגיאה</h1>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Clinic header */}
      <div className="mb-8 text-center">
        {clinic?.logoUrl && (
          <img src={clinic.logoUrl} alt={clinic.name} className="mx-auto mb-3 h-16 w-16 rounded-full object-cover" />
        )}
        <h1 className="text-2xl font-bold text-gray-800">{clinic?.name}</h1>
        {clinic?.address && <p className="text-sm text-gray-500">{clinic.address}</p>}
        {clinic?.phone && <p className="text-sm text-gray-500">{clinic.phone}</p>}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1 text-xs text-gray-500 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 ${i === 0 ? 'rounded-r' : ''} ${
                i === STEPS.length - 1 ? 'rounded-l' : ''
              } ${i < step ? 'bg-green-500' : i === step ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Step 0: Visit type */}
      {step === 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">בחר סוג ביקור</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {clinic?.visitTypes.map((vt) => {
              const Icon = VISIT_TYPE_ICONS[vt.key] || MoreHorizontal;
              const isSelected = selectedType === vt.label;
              return (
                <button
                  key={vt.key}
                  onClick={() => setSelectedType(vt.label)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-8 w-8 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{vt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Veterinarian */}
      {step === 1 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">בחר וטרינר</h2>
          {vets.length === 0 ? (
            <p className="text-center text-gray-500">אין וטרינרים זמינים</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {vets.map((vet) => {
                const isSelected = selectedVet === vet.id;
                return (
                  <button
                    key={vet.id}
                    onClick={() => setSelectedVet(vet.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {vet.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{vet.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">בחר תאריך ושעה</h2>

          {/* Calendar */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between">
                <button onClick={goNextMonth} className="rounded p-1 hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="font-medium">{monthName}</span>
                <button onClick={goPrevMonth} className="rounded p-1 hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const dateObj = new Date(calYear, calMonth, day);
                  dateObj.setHours(0, 0, 0, 0);
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isPast = dateObj < today;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlot('');
                      }}
                      className={`rounded-lg p-2 text-sm transition-colors ${
                        isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Slots */}
          {selectedDate && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-600">שעות פנויות:</h3>
              {slotsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  אין שעות פנויות לתאריך זה
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((slot) => {
                    const time = new Date(slot).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Client & Animal details */}
      {step === 3 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">פרטי לקוח וחיה</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-4">
                <h3 className="mb-3 font-medium text-gray-700">פרטי לקוח</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>שם פרטי *</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="ישראל"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>שם משפחה *</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="ישראלי"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טלפון *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="050-1234567"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>אימייל</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h3 className="mb-3 font-medium text-gray-700">פרטי החיה</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>שם החיה *</Label>
                    <Input
                      value={form.animalName}
                      onChange={(e) => setForm({ ...form, animalName: e.target.value })}
                      placeholder="רקס"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סוג</Label>
                    <select
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      {SPECIES_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>גזע</Label>
                    <Input
                      value={form.breed}
                      onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      placeholder="גולדן רטריבר"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מין</Label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">סיכום ואישור</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">{selectedType}</span>
                  <span className="text-gray-500">סוג ביקור</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">{selectedVetName}</span>
                  <span className="text-gray-500">וטרינר</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">
                    {selectedSlot &&
                      new Date(selectedSlot).toLocaleDateString('he-IL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </span>
                  <span className="text-gray-500">תאריך</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">
                    {selectedSlot &&
                      new Date(selectedSlot).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </span>
                  <span className="text-gray-500">שעה</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">{form.firstName} {form.lastName}</span>
                  <span className="text-gray-500">לקוח</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium" dir="ltr">{form.phone}</span>
                  <span className="text-gray-500">טלפון</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{form.animalName}</span>
                  <span className="text-gray-500">חיה</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => { setStep(step - 1); setError(''); }}
          >
            <ChevronRight className="ml-1 h-4 w-4" />
            הקודם
          </Button>
        )}
        <div className="flex-1" />
        {step < 4 ? (
          <Button
            onClick={() => { setStep(step + 1); setError(''); }}
            disabled={!canProceed()}
          >
            הבא
            <ChevronLeft className="mr-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                קובע תור...
              </>
            ) : (
              'קבע תור'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
