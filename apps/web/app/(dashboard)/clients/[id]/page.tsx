'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, Phone, Mail, MapPin, PawPrint, Calendar,
  Receipt, FileText, User, Clock, CreditCard, Plus, Download, Pencil,
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

interface PaymentInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  status: string;
  itemsSummary: string;
  total: number;
  paidAmount: number;
  paymentMethod?: string;
}

interface PaymentHistory {
  invoices: PaymentInvoice[];
  totalPaid: number;
  totalUnpaid: number;
  invoiceCount: number;
}

interface ClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber: string;
  dateOfBirth?: string;
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
const paymentMethodLabels: Record<string, string> = {
  cash: 'מזומן', credit_card: 'כרטיס אשראי', bank_transfer: 'העברה בנקאית',
  check: 'צ\'ק', bit: 'ביט', paybox: 'פייבוקס', other: 'אחר',
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

  const [showEditClient, setShowEditClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', address: '', idNumber: '', dateOfBirth: '', notes: '',
  });
  const [clientFormError, setClientFormError] = useState('');
  const [clientSaving, setClientSaving] = useState(false);

  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [animalForm, setAnimalForm] = useState({
    name: '', species: 'dog', breed: '', gender: 'unknown',
    dateOfBirth: '', weight: '', microchipNumber: '', isNeutered: false, notes: '',
  });
  const [animalFormError, setAnimalFormError] = useState('');
  const [animalSaving, setAnimalSaving] = useState(false);

  const [showEditAnimal, setShowEditAnimal] = useState(false);
  const [editAnimalId, setEditAnimalId] = useState<string | null>(null);
  const [editAnimalForm, setEditAnimalForm] = useState({
    name: '', species: 'dog', breed: '', gender: 'unknown',
    dateOfBirth: '', weight: '', microchipNumber: '', isNeutered: false, notes: '',
  });
  const [editAnimalFormError, setEditAnimalFormError] = useState('');
  const [editAnimalSaving, setEditAnimalSaving] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportingAnimal, setExportingAnimal] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animalRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleExportPDF = async () => {
    if (!client || !contentRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      // Expand all animals for the PDF
      const prevExpanded = expandedAnimal;
      setExpandedAnimal(null);

      // Wait for re-render
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      pdf.save(`${client.firstName}_${client.lastName}_תיק_לקוח.pdf`);
      setExpandedAnimal(prevExpanded);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAnimalPDF = async (animal: Animal) => {
    const el = animalRefs.current[animal.id];
    if (!el) return;
    setExportingAnimal(animal.id);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(el, {
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

      const ownerName = client ? `${client.firstName}_${client.lastName}` : '';
      pdf.save(`${animal.name}_${ownerName}_תיק_חיה.pdf`);
    } catch (err) {
      console.error('Animal PDF export error:', err);
    } finally {
      setExportingAnimal(null);
    }
  };

  const openEditClient = () => {
    if (!client) return;
    setClientForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      idNumber: client.idNumber || '',
      dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
      notes: client.notes || '',
    });
    setClientFormError('');
    setShowEditClient(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.firstName || !clientForm.lastName || !clientForm.phone || !clientForm.idNumber) {
      setClientFormError('שם פרטי, שם משפחה, טלפון ותעודת זהות הם שדות חובה');
      return;
    }
    setClientSaving(true);
    setClientFormError('');
    try {
      const token = getToken();
      const body: any = { ...clientForm };
      if (!body.email) delete body.email;
      if (!body.address) delete body.address;
      if (!body.dateOfBirth) delete body.dateOfBirth;
      if (!body.notes) delete body.notes;
      await apiFetch(`/clients/${params.id}`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify(body),
      });
      setShowEditClient(false);
      fetchClient();
    } catch (err: any) {
      setClientFormError(err.message || 'שגיאה בשמירה');
    } finally {
      setClientSaving(false);
    }
  };

  const fetchClient = async () => {
    const token = getToken();
    if (!token || !params.id) return;
    try {
      const res = await apiFetch<ClientDetail>(`/clients/${params.id}`, { token });
      setClient(res);
      if (res.animals?.length > 0 && !expandedAnimal) setExpandedAnimal(res.animals[0].id);
    } catch {
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    const token = getToken();
    if (!token || !params.id) return;
    setPaymentLoading(true);
    try {
      const res = await apiFetch<PaymentHistory>(`/pos/client/${params.id}/payments`, { token });
      setPaymentHistory(res);
    } catch {
      // Payment history is optional, fail silently
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
    fetchPaymentHistory();
  }, [params.id]);

  const openAddAnimal = () => {
    setAnimalForm({ name: '', species: 'dog', breed: '', gender: 'unknown', dateOfBirth: '', weight: '', microchipNumber: '', isNeutered: false, notes: '' });
    setAnimalFormError('');
    setShowAddAnimal(true);
  };

  const openEditAnimal = (animal: Animal) => {
    setEditAnimalId(animal.id);
    setEditAnimalForm({
      name: animal.name,
      species: animal.species,
      breed: animal.breed || '',
      gender: animal.gender,
      dateOfBirth: animal.dateOfBirth ? animal.dateOfBirth.split('T')[0] : '',
      weight: animal.weight ? String(animal.weight) : '',
      microchipNumber: animal.microchipNumber || '',
      isNeutered: animal.isNeutered,
      notes: animal.notes || '',
    });
    setEditAnimalFormError('');
    setShowEditAnimal(true);
  };

  const handleEditAnimal = async () => {
    if (!editAnimalForm.name) { setEditAnimalFormError('שם החיה הוא שדה חובה'); return; }
    setEditAnimalSaving(true); setEditAnimalFormError('');
    try {
      const token = getToken();
      const body: any = {
        name: editAnimalForm.name, species: editAnimalForm.species,
        gender: editAnimalForm.gender, isNeutered: editAnimalForm.isNeutered,
      };
      if (editAnimalForm.breed) body.breed = editAnimalForm.breed;
      if (editAnimalForm.dateOfBirth) body.dateOfBirth = editAnimalForm.dateOfBirth;
      if (editAnimalForm.weight) body.weight = parseFloat(editAnimalForm.weight);
      if (editAnimalForm.microchipNumber) body.microchipNumber = editAnimalForm.microchipNumber;
      if (editAnimalForm.notes) body.notes = editAnimalForm.notes;
      await apiFetch(`/animals/${editAnimalId}`, { method: 'PATCH', token: token || undefined, body: JSON.stringify(body) });
      setShowEditAnimal(false);
      fetchClient();
    } catch (err: any) { setEditAnimalFormError(err.message || 'שגיאה בשמירה'); }
    finally { setEditAnimalSaving(false); }
  };

  const handleAddAnimal = async () => {
    if (!animalForm.name) { setAnimalFormError('שם החיה הוא שדה חובה'); return; }
    setAnimalSaving(true); setAnimalFormError('');
    try {
      const token = getToken();
      const body: any = { clientId: params.id, name: animalForm.name, species: animalForm.species, gender: animalForm.gender, isNeutered: animalForm.isNeutered };
      if (animalForm.breed) body.breed = animalForm.breed;
      if (animalForm.dateOfBirth) body.dateOfBirth = animalForm.dateOfBirth;
      if (animalForm.weight) body.weight = parseFloat(animalForm.weight);
      if (animalForm.microchipNumber) body.microchipNumber = animalForm.microchipNumber;
      if (animalForm.notes) body.notes = animalForm.notes;
      await apiFetch('/animals', { method: 'POST', token: token || undefined, body: JSON.stringify(body) });
      setShowAddAnimal(false);
      fetchClient();
    } catch (err: any) { setAnimalFormError(err.message || 'שגיאה בשמירה'); }
    finally { setAnimalSaving(false); }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">טוען...</div>;
  if (!client) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{client.firstName} {client.lastName}</h1>
            <p className="text-sm text-muted-foreground">
              לקוח מאז {new Date(client.createdAt).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEditClient}>
            <Pencil className="ml-2 h-4 w-4" />
            <span className="hidden sm:inline">עריכת לקוח</span>
            <span className="sm:hidden">עריכה</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            <Download className="ml-2 h-4 w-4" />
            <span className="hidden sm:inline">{exporting ? 'מייצא...' : 'ייצוא PDF'}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">עריכת לקוח</h2>
            {clientFormError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{clientFormError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם פרטי *</Label>
                <Input value={clientForm.firstName} onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>שם משפחה *</Label>
                <Input value={clientForm.lastName} onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>טלפון *</Label>
                <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} dir="ltr" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>כתובת</Label>
                <Input value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>תעודת זהות *</Label>
                <Input value={clientForm.idNumber} onChange={(e) => setClientForm({ ...clientForm, idNumber: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>תאריך לידה</Label>
                <Input type="date" value={clientForm.dateOfBirth} onChange={(e) => setClientForm({ ...clientForm, dateOfBirth: e.target.value })} dir="ltr" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>הערות</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditClient(false)}>ביטול</Button>
              <Button onClick={handleSaveClient} disabled={clientSaving}>
                {clientSaving ? 'שומר...' : 'שמירה'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Content Area */}
      <div ref={contentRef}>
      {/* Client Info + Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            {client.dateOfBirth && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>תאריך לידה: {new Date(client.dateOfBirth).toLocaleDateString('he-IL')}</span>
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

      {/* Add Animal Modal */}
      {showAddAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">הוספת חיה ל{client.firstName} {client.lastName}</h2>
            {animalFormError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{animalFormError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>שם החיה *</Label><Input value={animalForm.name} onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={animalForm.species} onChange={(e) => setAnimalForm({ ...animalForm, species: e.target.value })}>
                  {Object.entries(speciesLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>גזע</Label><Input value={animalForm.breed} onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>מין</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={animalForm.gender} onChange={(e) => setAnimalForm({ ...animalForm, gender: e.target.value })}>
                  {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>תאריך לידה</Label><Input type="date" value={animalForm.dateOfBirth} onChange={(e) => setAnimalForm({ ...animalForm, dateOfBirth: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>משקל (ק&quot;ג)</Label><Input type="number" step="0.1" value={animalForm.weight} onChange={(e) => setAnimalForm({ ...animalForm, weight: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>מספר שבב</Label><Input value={animalForm.microchipNumber} onChange={(e) => setAnimalForm({ ...animalForm, microchipNumber: e.target.value })} dir="ltr" /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isNeutered" checked={animalForm.isNeutered} onChange={(e) => setAnimalForm({ ...animalForm, isNeutered: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="isNeutered">מסורס/מעוקרת</Label>
              </div>
              <div className="col-span-2 space-y-2"><Label>הערות</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={animalForm.notes} onChange={(e) => setAnimalForm({ ...animalForm, notes: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddAnimal(false)}>ביטול</Button>
              <Button onClick={handleAddAnimal} disabled={animalSaving}>{animalSaving ? 'שומר...' : 'הוספה'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Animal Modal */}
      {showEditAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">עריכת חיה</h2>
            {editAnimalFormError && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{editAnimalFormError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>שם החיה *</Label><Input value={editAnimalForm.name} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editAnimalForm.species} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, species: e.target.value })}>
                  {Object.entries(speciesLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>גזע</Label><Input value={editAnimalForm.breed} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, breed: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>מין</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editAnimalForm.gender} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, gender: e.target.value })}>
                  {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>תאריך לידה</Label><Input type="date" value={editAnimalForm.dateOfBirth} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, dateOfBirth: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>משקל (ק&quot;ג)</Label><Input type="number" step="0.1" value={editAnimalForm.weight} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, weight: e.target.value })} dir="ltr" /></div>
              <div className="space-y-2"><Label>מספר שבב</Label><Input value={editAnimalForm.microchipNumber} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, microchipNumber: e.target.value })} dir="ltr" /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="editIsNeutered" checked={editAnimalForm.isNeutered} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, isNeutered: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="editIsNeutered">מסורס/מעוקרת</Label>
              </div>
              <div className="col-span-2 space-y-2"><Label>הערות</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editAnimalForm.notes} onChange={(e) => setEditAnimalForm({ ...editAnimalForm, notes: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditAnimal(false)}>ביטול</Button>
              <Button onClick={handleEditAnimal} disabled={editAnimalSaving}>{editAnimalSaving ? 'שומר...' : 'שמירה'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Animals */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-purple-600" />
            בעלי חיים ({client.animals.length})
          </h2>
          <Button size="sm" onClick={openAddAnimal}><Plus className="ml-1 h-4 w-4" />הוסף חיה</Button>
        </div>
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
                <div
                  className="flex w-full cursor-pointer items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedAnimal(expandedAnimal === animal.id ? null : animal.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <PawPrint className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <Link href={`/animals/${animal.id}`} className="font-medium text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{animal.name}</Link>
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
                </div>

                {expandedAnimal === animal.id && (
                  <div className="border-t bg-gray-50 p-4" ref={(el) => { animalRefs.current[animal.id] = el; }}>
                    <div className="mb-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditAnimal(animal); }}
                      >
                        <Pencil className="ml-1 h-3.5 w-3.5" />
                        עריכה
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleExportAnimalPDF(animal); }}
                        disabled={exportingAnimal === animal.id}
                      >
                        <Download className="ml-1 h-3.5 w-3.5" />
                        {exportingAnimal === animal.id ? 'מייצא...' : 'ייצוא PDF'}
                      </Button>
                    </div>
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

      {/* Payment History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />היסטוריית תשלומים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentLoading ? (
            <p className="text-sm text-muted-foreground">טוען היסטוריית תשלומים...</p>
          ) : !paymentHistory || paymentHistory.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין היסטוריית תשלומים</p>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <div className="text-lg font-bold text-green-700" dir="ltr">₪{paymentHistory.totalPaid.toFixed(2)}</div>
                  <div className="text-xs text-green-600">שולם</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <div className="text-lg font-bold text-red-700" dir="ltr">₪{paymentHistory.totalUnpaid.toFixed(2)}</div>
                  <div className="text-xs text-red-600">לא שולם</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-700">{paymentHistory.invoiceCount}</div>
                  <div className="text-xs text-gray-600">סה&quot;כ חשבוניות</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right text-xs text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">מס׳ חשבונית</th>
                      <th className="pb-2 pr-2 font-medium">תאריך</th>
                      <th className="pb-2 pr-2 font-medium">סטטוס</th>
                      <th className="pb-2 pr-2 font-medium">פריטים</th>
                      <th className="pb-2 pr-2 font-medium">סכום</th>
                      <th className="pb-2 pr-2 font-medium">שולם</th>
                      <th className="pb-2 pr-2 font-medium">אמצעי תשלום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-2 pr-2" dir="ltr">{inv.invoiceNumber}</td>
                        <td className="py-2 pr-2">{new Date(inv.date).toLocaleDateString('he-IL')}</td>
                        <td className="py-2 pr-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${invoiceStatusColors[inv.status] || ''}`}>
                            {invoiceStatusLabels[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="py-2 pr-2 max-w-[200px] truncate">{inv.itemsSummary}</td>
                        <td className="py-2 pr-2" dir="ltr">₪{inv.total.toFixed(2)}</td>
                        <td className="py-2 pr-2" dir="ltr">₪{inv.paidAmount.toFixed(2)}</td>
                        <td className="py-2 pr-2">{inv.paymentMethod ? (paymentMethodLabels[inv.paymentMethod] || inv.paymentMethod) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>{/* end PDF Content Area */}
    </div>
  );
}
