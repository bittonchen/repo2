'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, PawPrint, Calendar, User, FileText, Download,
  Stethoscope, Pill, Clock, Bell, Syringe, Weight, Thermometer, Camera,
} from 'lucide-react';
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

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  veterinarian?: { id: string; name: string };
}

interface Reminder {
  id: string;
  type: string;
  status: string;
  message: string;
  sendAt: string;
  sentAt?: string;
  channel: string;
}

interface AnimalDetail {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  dateOfBirth?: string;
  weight?: number;
  microchipNumber?: string;
  imageUrl?: string;
  isNeutered: boolean;
  notes?: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  reminders: Reminder[];
}

const speciesLabels: Record<string, string> = {
  dog: 'כלב', cat: 'חתול', bird: 'ציפור', rabbit: 'ארנב',
  hamster: 'אוגר', reptile: 'זוחל', fish: 'דג', other: 'אחר',
};
const genderLabels: Record<string, string> = {
  male: 'זכר', female: 'נקבה', unknown: 'לא ידוע',
};
const statusLabels: Record<string, string> = {
  pending: 'ממתין', confirmed: 'אושר', in_progress: 'בטיפול',
  completed: 'הושלם', cancelled: 'בוטל', no_show: 'לא הגיע',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800', no_show: 'bg-red-100 text-red-800',
};
const reminderTypeLabels: Record<string, string> = {
  vaccination: 'חיסון', appointment: 'תור', follow_up: 'מעקב', custom: 'מותאם אישית',
};
const reminderStatusLabels: Record<string, string> = {
  pending: 'ממתין', sent: 'נשלח', failed: 'נכשל', cancelled: 'בוטל',
};
const reminderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-800',
};

function calcAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) return `${years} שנים`;
  if (months > 0) return `${months} חודשים`;
  return 'פחות מחודש';
}

export default function AnimalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnimal = async () => {
      const token = getToken();
      if (!token || !params.id) return;
      try {
        const res = await apiFetch<AnimalDetail>(`/animals/${params.id}`, { token });
        setAnimal(res);
      } catch {
        router.push('/animals');
      } finally {
        setLoading(false);
      }
    };
    fetchAnimal();
  }, [params.id]);

  const handleExportPDF = async () => {
    if (!animal || !contentRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${animal.name}_${animal.client.firstName}_${animal.client.lastName}_תיק_חיה.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !animal) return;
    const token = getToken();
    if (!token) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/upload?folder=animals`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      await apiFetch(`/animals/${animal.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ imageUrl: url }),
      });

      setAnimal({ ...animal, imageUrl: url });
    } catch (err) {
      console.error('Image upload error:', err);
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!animal) return null;

  // Extract unique prescriptions from medical records
  const prescriptions = animal.medicalRecords
    .filter((r) => r.prescription)
    .map((r) => ({ date: r.date, prescription: r.prescription!, vet: r.veterinarian?.name }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer group">
              {animal.imageUrl ? (
                <img
                  src={animal.imageUrl}
                  alt={animal.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <PawPrint className="h-6 w-6 text-purple-600" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <div>
              <h1 className="text-2xl font-bold">{animal.name}</h1>
              <p className="text-sm text-muted-foreground">
                {speciesLabels[animal.species] || animal.species}
                {animal.breed ? ` • ${animal.breed}` : ''}
                {' • '}{genderLabels[animal.gender]}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>
          <Download className="ml-2 h-4 w-4" />
          {exporting ? 'מייצא...' : 'ייצוא PDF'}
        </Button>
      </div>

      {/* PDF Content */}
      <div ref={contentRef}>
        {/* Animal Info + Owner + Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Animal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-purple-600" />
                פרטי החיה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">סוג</div>
                  <div className="text-sm font-medium">{speciesLabels[animal.species] || animal.species}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">גזע</div>
                  <div className="text-sm font-medium">{animal.breed || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">מין</div>
                  <div className="text-sm font-medium">{genderLabels[animal.gender]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">תאריך לידה</div>
                  <div className="text-sm font-medium">
                    {animal.dateOfBirth
                      ? `${new Date(animal.dateOfBirth).toLocaleDateString('he-IL')} (${calcAge(animal.dateOfBirth)})`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">משקל</div>
                  <div className="text-sm font-medium">{animal.weight ? `${animal.weight} ק"ג` : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">עיקור/סירוס</div>
                  <div className="text-sm font-medium">{animal.isNeutered ? 'כן' : 'לא'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">מספר שבב</div>
                  <div className="text-sm font-medium" dir="ltr">{animal.microchipNumber || '—'}</div>
                </div>
              </div>
              {animal.notes && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
                  {animal.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                בעלים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/clients/${animal.client.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                {animal.client.firstName} {animal.client.lastName}
              </Link>
              <div className="text-sm text-muted-foreground" dir="ltr">{animal.client.phone}</div>
              {animal.client.email && (
                <div className="text-sm text-muted-foreground" dir="ltr">{animal.client.email}</div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex flex-col items-center pt-6">
                <Stethoscope className="mb-2 h-8 w-8 text-green-600" />
                <div className="text-2xl font-bold">{animal.medicalRecords.length}</div>
                <div className="text-xs text-muted-foreground">רשומות רפואיות</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center pt-6">
                <Calendar className="mb-2 h-8 w-8 text-blue-600" />
                <div className="text-2xl font-bold">{animal.appointments.length}</div>
                <div className="text-xs text-muted-foreground">ביקורים</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center pt-6">
                <Pill className="mb-2 h-8 w-8 text-orange-600" />
                <div className="text-2xl font-bold">{prescriptions.length}</div>
                <div className="text-xs text-muted-foreground">מרשמים</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center pt-6">
                <Bell className="mb-2 h-8 w-8 text-yellow-600" />
                <div className="text-2xl font-bold">{animal.reminders.length}</div>
                <div className="text-xs text-muted-foreground">תזכורות</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Medical Records */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              היסטוריה רפואית ({animal.medicalRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {animal.medicalRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין רשומות רפואיות</p>
            ) : (
              <div className="space-y-4">
                {animal.medicalRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-base">
                          {record.diagnosis || 'ביקור'}
                        </div>
                        {record.veterinarian && (
                          <div className="text-sm text-muted-foreground">
                            וטרינר: {record.veterinarian.name}
                          </div>
                        )}
                      </div>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('he-IL')}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {record.treatment && (
                        <div className="flex items-start gap-2 text-sm">
                          <Syringe className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                          <div><span className="font-medium">טיפול:</span> {record.treatment}</div>
                        </div>
                      )}
                      {record.prescription && (
                        <div className="flex items-start gap-2 text-sm">
                          <Pill className="mt-0.5 h-4 w-4 text-orange-500 shrink-0" />
                          <div><span className="font-medium">מרשם:</span> {record.prescription}</div>
                        </div>
                      )}
                      {record.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="mt-0.5 h-4 w-4 text-gray-500 shrink-0" />
                          <div><span className="font-medium">הערות:</span> {record.notes}</div>
                        </div>
                      )}
                    </div>

                    {(record.weight || record.temperature) && (
                      <div className="mt-3 flex gap-4 border-t pt-2">
                        {record.weight && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Weight className="h-3.5 w-3.5" />
                            <span>{record.weight} ק&quot;ג</span>
                          </div>
                        )}
                        {record.temperature && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Thermometer className="h-3.5 w-3.5" />
                            <span>{record.temperature}°C</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments + Prescriptions + Reminders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                היסטוריית ביקורים ({animal.appointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין ביקורים</p>
              ) : (
                <div className="space-y-3">
                  {animal.appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between border-b py-3 last:border-0">
                      <div>
                        <div className="text-sm font-medium">{apt.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.veterinarian?.name}
                        </div>
                        {apt.notes && (
                          <div className="mt-1 text-xs text-muted-foreground">{apt.notes}</div>
                        )}
                      </div>
                      <div className="text-left">
                        <span className={`rounded px-2 py-0.5 text-xs ${statusColors[apt.status] || ''}`}>
                          {statusLabels[apt.status] || apt.status}
                        </span>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(apt.startTime).toLocaleDateString('he-IL')}
                          {' '}
                          {new Date(apt.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-orange-600" />
                מרשמים ותרופות ({prescriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין מרשמים</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((p, i) => (
                    <div key={i} className="border-b py-3 last:border-0">
                      <div className="text-sm font-medium">{p.prescription}</div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(p.date).toLocaleDateString('he-IL')}</span>
                        {p.vet && <span>• {p.vet}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders */}
        {animal.reminders.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                תזכורות ({animal.reminders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {animal.reminders.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between border-b py-3 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{rem.message}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{reminderTypeLabels[rem.type] || rem.type}</span>
                        <span>•</span>
                        <span>{rem.channel === 'sms' ? 'SMS' : rem.channel === 'email' ? 'אימייל' : 'WhatsApp'}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`rounded px-2 py-0.5 text-xs ${reminderStatusColors[rem.status] || ''}`}>
                        {reminderStatusLabels[rem.status] || rem.status}
                      </span>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(rem.sendAt).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>{/* end PDF Content */}
    </div>
  );
}
