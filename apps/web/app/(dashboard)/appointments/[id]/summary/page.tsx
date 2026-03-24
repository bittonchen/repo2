'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Printer } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  weight?: number;
  temperature?: number;
  veterinarian?: { id: string; name: string };
}

interface AppointmentDetail {
  id: string;
  clientId: string;
  animalId: string;
  veterinarianId: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  client?: { id: string; firstName: string; lastName: string; phone: string };
  animal?: { id: string; name: string; species: string; breed?: string };
  veterinarian?: { id: string; name: string };
  medicalRecord?: MedicalRecord | null;
}

const speciesLabels: Record<string, string> = {
  dog: 'כלב', cat: 'חתול', bird: 'ציפור', rabbit: 'ארנב',
  hamster: 'אוגר', reptile: 'זוחל', fish: 'דג', other: 'אחר',
};

export default function VisitSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const token = getToken();
      if (!token || !params.id) return;
      try {
        const res = await apiFetch<AppointmentDetail>(`/appointments/${params.id}`, { token });
        setAppointment(res);
      } catch {
        router.push('/appointments');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [params.id, router]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!appointment) return null;

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const record = appointment.medicalRecord;

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      {/* Action bar - hidden in print */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/appointments/${params.id}`)}>
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה לפרטי התור
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="ml-2 h-4 w-4" />
          הדפסה
        </Button>
      </div>

      {/* Printable content */}
      <div id="visit-summary">
        {/* Clinic Header */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-600 print:text-black">VetFlow</h1>
          <p className="text-lg text-muted-foreground mt-1">סיכום ביקור</p>
        </div>

        {/* Visit Info */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">פרטי הביקור</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">תאריך: </span>
              <span className="font-medium">{startDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-muted-foreground">שעה: </span>
              <span className="font-medium" dir="ltr">
                {startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {endDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">סוג: </span>
              <span className="font-medium">{appointment.type}</span>
            </div>
          </div>
        </section>

        {/* Client & Animal */}
        <section className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">לקוח</h2>
            {appointment.client && (
              <div className="text-sm space-y-1">
                <div className="font-medium">{appointment.client.firstName} {appointment.client.lastName}</div>
                {appointment.client.phone && <div className="text-muted-foreground" dir="ltr">{appointment.client.phone}</div>}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">חיה</h2>
            {appointment.animal && (
              <div className="text-sm space-y-1">
                <div className="font-medium">{appointment.animal.name}</div>
                <div className="text-muted-foreground">
                  {speciesLabels[appointment.animal.species] || appointment.animal.species}
                  {appointment.animal.breed ? ` - ${appointment.animal.breed}` : ''}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Veterinarian */}
        {appointment.veterinarian && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">וטרינר מטפל</h2>
            <div className="text-sm font-medium">{appointment.veterinarian.name}</div>
          </section>
        )}

        {/* Medical Record */}
        {record ? (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">רשומה רפואית</h2>
            <div className="space-y-4 text-sm">
              {record.diagnosis && (
                <div className="break-inside-avoid">
                  <div className="font-semibold mb-1">אבחנה</div>
                  <div className="rounded border bg-gray-50 p-3 print:bg-white whitespace-pre-wrap">{record.diagnosis}</div>
                </div>
              )}
              {record.treatment && (
                <div className="break-inside-avoid">
                  <div className="font-semibold mb-1">טיפול</div>
                  <div className="rounded border bg-gray-50 p-3 print:bg-white whitespace-pre-wrap">{record.treatment}</div>
                </div>
              )}
              {record.prescription && (
                <div className="break-inside-avoid">
                  <div className="font-semibold mb-1">מרשם</div>
                  <div className="rounded border bg-gray-50 p-3 print:bg-white whitespace-pre-wrap">{record.prescription}</div>
                </div>
              )}
              {record.notes && (
                <div className="break-inside-avoid">
                  <div className="font-semibold mb-1">הערות</div>
                  <div className="rounded border bg-gray-50 p-3 print:bg-white whitespace-pre-wrap">{record.notes}</div>
                </div>
              )}
              {(record.weight || record.temperature) && (
                <div className="flex gap-8 pt-2">
                  {record.weight && (
                    <div>
                      <span className="text-muted-foreground">משקל: </span>
                      <span className="font-medium">{record.weight} ק&quot;ג</span>
                    </div>
                  )}
                  {record.temperature && (
                    <div>
                      <span className="text-muted-foreground">חום: </span>
                      <span className="font-medium">{record.temperature}°C</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">רשומה רפואית</h2>
            <p className="text-sm text-muted-foreground">לא מולאה רשומה רפואית לביקור זה</p>
          </section>
        )}

        {/* Appointment Notes */}
        {appointment.notes && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground border-b pb-1 mb-3">הערות לתור</h2>
            <div className="text-sm whitespace-pre-wrap">{appointment.notes}</div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-300 mt-8 pt-4 text-center text-xs text-muted-foreground">
          <p>הופק באמצעות VetFlow | {new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}
