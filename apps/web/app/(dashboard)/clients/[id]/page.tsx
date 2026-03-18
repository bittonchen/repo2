'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Phone, Mail, MapPin, PawPrint, Calendar,
  Receipt, FileText, User, Clock, CreditCard,
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
  veterinarian?: { name: string };
}

interface Animal {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  dateOfBirth?: string;
  weight?: number;
  microchipNumber?: string;
  isNeutered: boolean;
  notes?: string;
  medicalRecords?: MedicalRecord[];
}

interface Appointment {
  id: string;
  startTime: string;
  type: string;
  status: string;
  animal?: { name: string };
  veterinarian?: { name: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  notes?: string;
  createdAt: string;
  animals: Animal[];
  appointments: Appointment[];
  invoices: Invoice[];
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
const invoiceStatusLabels: Record<string, string> = {
  draft: 'טיוטה', sent: 'נשלח', paid: 'שולם', partially_paid: 'שולם חלקית', cancelled: 'בוטל',
};
const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', partially_paid: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      const token = getToken();
      if (!token || !params.id) return;
      try {
        const res = await apiFetch<ClientDetail>(`/clients/${params.id}`, { token });
        setClient(res);
        // Auto-expand first animal
        if (res.animals?.length > 0) setExpandedAnimal(res.animals[0].id);
      } catch {
        router.push('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id, router]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!client) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
          <p className="text-sm text-muted-foreground">
            לקוח מאז {new Date(client.createdAt).toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>

      {/* Client Info + Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />פרטי לקוח</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span dir="ltr">{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
            )}
            {client.idNumber && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">ת.ז. {client.idNumber}</span>
              </div>
            )}
            {client.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
                {client.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <PawPrint className="mb-2 h-8 w-8 text-purple-600" />
              <div className="text-2xl font-bold">{client.animals.length}</div>
              <div className="text-xs text-muted-foreground">חיות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Calendar className="mb-2 h-8 w-8 text-blue-600" />
              <div className="text-2xl font-bold">{client.appointments.length}</div>
              <div className="text-xs text-muted-foreground">תורים אחרונים</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Receipt className="mb-2 h-8 w-8 text-green-600" />
              <div className="text-2xl font-bold">{client.invoices.length}</div>
              <div className="text-xs text-muted-foreground">חשבוניות</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animals */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-purple-600" />
          בעלי חיים ({client.animals.length})
        </h2>
        {client.animals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              אין חיות רשומות ללקוח זה
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {client.animals.map((animal) => (
              <Card key={animal.id} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedAnimal(expandedAnimal === animal.id ? null : animal.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <PawPrint className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{animal.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {speciesLabels[animal.species] || animal.species}
                        {animal.breed ? ` • ${animal.breed}` : ''}
                        {' • '}{genderLabels[animal.gender]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {animal.dateOfBirth && <span>גיל: {calcAge(animal.dateOfBirth)}</span>}
                    {animal.weight && <span>{animal.weight} ק&quot;ג</span>}
                    <span className={`rounded px-2 py-0.5 text-xs ${expandedAnimal === animal.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
                      {expandedAnimal === animal.id ? 'סגור' : 'פרטים'}
                    </span>
                  </div>
                </button>

                {expandedAnimal === animal.id && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <div className="text-xs text-muted-foreground">מין</div>
                        <div className="text-sm font-medium">{speciesLabels[animal.species]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">גזע</div>
                        <div className="text-sm font-medium">{animal.breed || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">מגדר</div>
                        <div className="text-sm font-medium">{genderLabels[animal.gender]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">תאריך לידה</div>
                        <div className="text-sm font-medium">
                          {animal.dateOfBirth ? new Date(animal.dateOfBirth).toLocaleDateString('he-IL') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">משקל</div>
                        <div className="text-sm font-medium">{animal.weight ? `${animal.weight} ק"ג` : '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">שבב</div>
                        <div className="text-sm font-medium" dir="ltr">{animal.microchipNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">עיקור/סירוס</div>
                        <div className="text-sm font-medium">{animal.isNeutered ? 'כן' : 'לא'}</div>
                      </div>
                    </div>

                    {animal.notes && (
                      <div className="mt-3 rounded-lg bg-white p-3 text-sm text-muted-foreground">
                        {animal.notes}
                      </div>
                    )}

                    {/* Medical Records */}
                    {animal.medicalRecords && animal.medicalRecords.length > 0 && (
                      <div className="mt-4">
                        <h4 className="mb-2 text-sm font-semibold">היסטוריה רפואית אחרונה</h4>
                        <div className="space-y-2">
                          {animal.medicalRecords.map((record) => (
                            <div key={record.id} className="rounded-lg bg-white p-3 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">
                                  {record.diagnosis || 'ביקור'}
                                  {record.veterinarian && <span className="text-muted-foreground"> — {record.veterinarian.name}</span>}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(record.date).toLocaleDateString('he-IL')}
                                </span>
                              </div>
                              {record.treatment && (
                                <div className="mt-1 text-muted-foreground">טיפול: {record.treatment}</div>
                              )}
                              {record.prescription && (
                                <div className="text-muted-foreground">מרשם: {record.prescription}</div>
                              )}
                              <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                                {record.weight && <span>משקל: {record.weight} ק&quot;ג</span>}
                                {record.temperature && <span>חום: {record.temperature}°C</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Appointments + Invoices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />תורים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין תורים</p>
            ) : (
              <div className="space-y-2">
                {client.appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between border-b py-2 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{apt.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {apt.animal?.name} • {apt.veterinarian?.name}
                      </div>
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

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />חשבוניות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין חשבוניות</p>
            ) : (
              <div className="space-y-2">
                {client.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between border-b py-2 last:border-0">
                    <div>
                      <div className="text-sm font-medium" dir="ltr">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`rounded px-2 py-0.5 text-xs ${invoiceStatusColors[inv.status] || ''}`}>
                        {invoiceStatusLabels[inv.status] || inv.status}
                      </span>
                      <div className="mt-1 text-sm font-medium" dir="ltr">
                        ₪{inv.total.toFixed(2)}
                      </div>
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
