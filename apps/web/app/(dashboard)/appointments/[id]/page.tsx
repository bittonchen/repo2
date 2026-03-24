'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, Clock, User, PawPrint, Stethoscope, Calendar,
  Download, Thermometer, Weight, Pill, FileText, Edit, Plus, Printer,
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
  veterinarian?: { id: string; name: string; role?: string };
  medicalRecord?: MedicalRecord | null;
}

const statusLabels: Record<string, string> = {
  pending: 'ממתין', confirmed: 'אושר', in_progress: 'בטיפול',
  completed: 'הושלם', cancelled: 'בוטל', no_show: 'לא הגיע',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
};

const speciesLabels: Record<string, string> = {
  dog: 'כלב', cat: 'חתול', bird: 'ציפור', rabbit: 'ארנב',
  hamster: 'אוגר', reptile: 'זוחל', fish: 'דג', other: 'אחר',
};

const emptyMedicalForm = {
  diagnosis: '',
  treatment: '',
  prescription: '',
  notes: '',
  weight: '',
  temperature: '',
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Medical record form state
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [medicalForm, setMedicalForm] = useState(emptyMedicalForm);
  const [medicalFormError, setMedicalFormError] = useState('');
  const [medicalSaving, setMedicalSaving] = useState(false);

  const fetchAppointment = async () => {
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

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const updateStatus = async (status: string) => {
    if (!appointment) return;
    try {
      const token = getToken();
      await apiFetch(`/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ status }),
      });
      fetchAppointment();
    } catch { /* */ }
  };

  const downloadIcal = async () => {
    if (!appointment) return;
    try {
      const token = getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/appointments/${appointment.id}/ical`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment-${appointment.id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* */ }
  };

  const openGoogleCalendar = () => {
    if (!appointment) return;
    const start = new Date(appointment.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(appointment.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(`${appointment.type} - ${appointment.animal?.name || ''}`);
    const details = encodeURIComponent(
      `לקוח: ${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}\nחיה: ${appointment.animal?.name || ''}${appointment.veterinarian ? `\nוטרינר: ${appointment.veterinarian.name}` : ''}${appointment.notes ? `\nהערות: ${appointment.notes}` : ''}`
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`,
      '_blank'
    );
  };

  const openAddMedicalRecord = () => {
    setMedicalForm(emptyMedicalForm);
    setMedicalFormError('');
    setIsEditingMedical(false);
    setShowMedicalForm(true);
  };

  const openEditMedicalRecord = () => {
    if (!appointment?.medicalRecord) return;
    const record = appointment.medicalRecord;
    setMedicalForm({
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      prescription: record.prescription || '',
      notes: record.notes || '',
      weight: record.weight ? String(record.weight) : '',
      temperature: record.temperature ? String(record.temperature) : '',
    });
    setMedicalFormError('');
    setIsEditingMedical(true);
    setShowMedicalForm(true);
  };

  const handleSaveMedicalRecord = async () => {
    if (!appointment) return;
    setMedicalSaving(true);
    setMedicalFormError('');
    try {
      const token = getToken();
      const body: any = {
        animalId: appointment.animalId,
        appointmentId: appointment.id,
        veterinarianId: appointment.veterinarianId,
      };
      if (medicalForm.diagnosis) body.diagnosis = medicalForm.diagnosis;
      if (medicalForm.treatment) body.treatment = medicalForm.treatment;
      if (medicalForm.prescription) body.prescription = medicalForm.prescription;
      if (medicalForm.notes) body.notes = medicalForm.notes;
      if (medicalForm.weight) body.weight = parseFloat(medicalForm.weight);
      if (medicalForm.temperature) body.temperature = parseFloat(medicalForm.temperature);

      if (isEditingMedical && appointment.medicalRecord) {
        // Update existing record
        const { animalId, appointmentId, veterinarianId, ...updateBody } = body;
        await apiFetch(`/medical-records/${appointment.medicalRecord.id}`, {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify(updateBody),
        });
      } else {
        // Create new record
        await apiFetch('/medical-records', {
          method: 'POST',
          token: token || undefined,
          body: JSON.stringify(body),
        });
      }

      setShowMedicalForm(false);
      fetchAppointment();
    } catch (err: any) {
      setMedicalFormError(err.message || 'שגיאה בשמירת הרשומה הרפואית');
    } finally {
      setMedicalSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!appointment) return null;

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const medicalRecord = appointment.medicalRecord;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/appointments')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold sm:text-2xl">{appointment.type}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[appointment.status] || ''}`}>
                {statusLabels[appointment.status] || appointment.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {startDate.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status action buttons */}
          {appointment.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('confirmed')} className="bg-blue-500 text-white hover:bg-blue-600">
              אשר
            </Button>
          )}
          {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('in_progress')} className="bg-purple-500 text-white hover:bg-purple-600">
              התחל טיפול
            </Button>
          )}
          {appointment.status === 'in_progress' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('completed')} className="bg-green-500 text-white hover:bg-green-600">
              סיים
            </Button>
          )}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')} className="bg-gray-400 text-white hover:bg-gray-500">
              בטל
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push(`/appointments/${appointment.id}/summary`)}>
            <Printer className="ml-1 h-4 w-4" />
            סיכום ביקור
          </Button>
          <Button size="sm" variant="outline" onClick={downloadIcal}>
            <Download className="ml-1 h-4 w-4" />
            iCal
          </Button>
          <Button size="sm" variant="outline" onClick={openGoogleCalendar}>
            <Calendar className="ml-1 h-4 w-4" />
            Google
          </Button>
        </div>
      </div>

      {/* Info Cards - 2 columns */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              פרטי התור
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">תאריך</div>
                <div className="text-sm font-medium">
                  {startDate.toLocaleDateString('he-IL')}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">שעה</div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span dir="ltr">
                    {startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {endDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">סוג ביקור</div>
                <div className="text-sm font-medium">{appointment.type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">סטטוס</div>
                <span className={`rounded px-2 py-0.5 text-xs ${statusColors[appointment.status] || ''}`}>
                  {statusLabels[appointment.status] || appointment.status}
                </span>
              </div>
            </div>
            {appointment.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
                <div className="text-xs font-medium text-gray-500 mb-1">הערות</div>
                {appointment.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client & Animal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              לקוח וחיה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.client && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">לקוח</div>
                <Link
                  href={`/clients/${appointment.client.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {appointment.client.firstName} {appointment.client.lastName}
                </Link>
                {appointment.client.phone && (
                  <div className="text-sm text-muted-foreground" dir="ltr">{appointment.client.phone}</div>
                )}
              </div>
            )}
            {appointment.animal && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">חיה</div>
                <div className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-purple-600" />
                  <Link
                    href={`/animals/${appointment.animal.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {appointment.animal.name}
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground mr-6">
                  {speciesLabels[appointment.animal.species] || appointment.animal.species}
                  {appointment.animal.breed ? ` - ${appointment.animal.breed}` : ''}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Veterinarian Card */}
      {appointment.veterinarian && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              וטרינר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{appointment.veterinarian.name}</div>
            {appointment.veterinarian.role && (
              <div className="text-sm text-muted-foreground">{appointment.veterinarian.role}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical Record Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              רשומה רפואית
            </CardTitle>
            {medicalRecord ? (
              <Button size="sm" variant="outline" onClick={openEditMedicalRecord}>
                <Edit className="ml-1 h-4 w-4" />
                עריכה
              </Button>
            ) : (
              <Button size="sm" onClick={openAddMedicalRecord}>
                <Plus className="ml-1 h-4 w-4" />
                הוסף רשומה רפואית
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {medicalRecord ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {medicalRecord.diagnosis && (
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      אבחנה
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">{medicalRecord.diagnosis}</div>
                  </div>
                )}
                {medicalRecord.treatment && (
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Stethoscope className="h-3.5 w-3.5" />
                      טיפול
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">{medicalRecord.treatment}</div>
                  </div>
                )}
                {medicalRecord.prescription && (
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Pill className="h-3.5 w-3.5" />
                      מרשם
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">{medicalRecord.prescription}</div>
                  </div>
                )}
                {medicalRecord.notes && (
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <FileText className="h-3.5 w-3.5" />
                      הערות
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">{medicalRecord.notes}</div>
                  </div>
                )}
              </div>
              {(medicalRecord.weight || medicalRecord.temperature) && (
                <div className="flex gap-6 border-t pt-3">
                  {medicalRecord.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Weight className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">משקל:</span>
                      <span className="font-medium">{medicalRecord.weight} ק&quot;ג</span>
                    </div>
                  )}
                  {medicalRecord.temperature && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-muted-foreground">חום:</span>
                      <span className="font-medium">{medicalRecord.temperature}°C</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm">אין רשומה רפואית לתור זה</p>
              <p className="text-xs mt-1">לחצו על &quot;הוסף רשומה רפואית&quot; ליצירת רשומה חדשה</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Record Form Modal */}
      {showMedicalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              {isEditingMedical ? 'עריכת רשומה רפואית' : 'רשומה רפואית חדשה'}
            </h2>
            {medicalFormError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{medicalFormError}</div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>אבחנה</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={medicalForm.diagnosis}
                  onChange={(e) => setMedicalForm({ ...medicalForm, diagnosis: e.target.value })}
                  placeholder="תאר את האבחנה..."
                />
              </div>
              <div className="space-y-2">
                <Label>טיפול</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={medicalForm.treatment}
                  onChange={(e) => setMedicalForm({ ...medicalForm, treatment: e.target.value })}
                  placeholder="תאר את הטיפול שניתן..."
                />
              </div>
              <div className="space-y-2">
                <Label>מרשם</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={medicalForm.prescription}
                  onChange={(e) => setMedicalForm({ ...medicalForm, prescription: e.target.value })}
                  placeholder="תרופות ומרשמים..."
                />
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={medicalForm.notes}
                  onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })}
                  placeholder="הערות נוספות..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>משקל (ק&quot;ג)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={medicalForm.weight}
                    onChange={(e) => setMedicalForm({ ...medicalForm, weight: e.target.value })}
                    dir="ltr"
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>חום (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={medicalForm.temperature}
                    onChange={(e) => setMedicalForm({ ...medicalForm, temperature: e.target.value })}
                    dir="ltr"
                    placeholder="38.5"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMedicalForm(false)}>ביטול</Button>
              <Button onClick={handleSaveMedicalRecord} disabled={medicalSaving}>
                {medicalSaving ? 'שומר...' : 'שמירה'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
