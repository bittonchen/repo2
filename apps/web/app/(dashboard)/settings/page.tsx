'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import {
  Building2,
  Clock,
  Bell,
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Copy,
  MonitorDot,
  Wifi,
  WifiOff,
} from 'lucide-react';

type Tab = 'clinic' | 'hours' | 'notifications' | 'profile' | 'booking' | 'pacs';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: WorkingHours;
  notificationSettings?: NotificationSettings;
  settings?: { bookingEnabled?: boolean; [key: string]: any };
}

interface WorkingHoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

type WorkingHours = Record<string, WorkingHoursEntry>;

interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  reminderHoursBefore: number;
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

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  smsEnabled: true,
  emailEnabled: true,
  whatsappEnabled: false,
  reminderHoursBefore: 24,
};

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: 'clinic', label: 'פרטי קליניקה', icon: Building2 },
  { key: 'hours', label: 'שעות פעילות', icon: Clock },
  { key: 'notifications', label: 'התראות', icon: Bell },
  { key: 'booking', label: 'הזמנת תורים אונליין', icon: Globe },
  { key: 'pacs', label: 'PACS / DICOM', icon: MonitorDot },
  { key: 'profile', label: 'פרופיל', icon: User },
];

function StatusMessage({ type, message }: { type: 'success' | 'error'; message: string }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-md p-3 text-sm ${
        isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('clinic');
  const [loading, setLoading] = useState(true);

  // Clinic details
  const [clinicForm, setClinicForm] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
  });
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicMsg, setClinicMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Working hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMsg, setHoursMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PACS
  const [pacsForm, setPacsForm] = useState({ orthancUrl: '', username: '', password: '' });
  const [pacsSaving, setPacsSaving] = useState(false);
  const [pacsMsg, setPacsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pacsTesting, setPacsTesting] = useState(false);
  const [pacsConnected, setPacsConnected] = useState<boolean | null>(null);

  // Booking
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Profile
  const [profileUser, setProfileUser] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch tenant data on mount
  useEffect(() => {
    async function fetchTenant() {
      try {
        const token = getToken();
        const tenant = await apiFetch<Tenant>('/tenants/current', { token: token || undefined });
        setClinicForm({
          name: tenant.name || '',
          slug: tenant.slug || '',
          address: tenant.address || '',
          phone: tenant.phone || '',
          email: tenant.email || '',
        });
        if (tenant.workingHours) {
          setWorkingHours({ ...DEFAULT_WORKING_HOURS, ...tenant.workingHours });
        }
        if (tenant.notificationSettings) {
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...tenant.notificationSettings });
        }
        if (tenant.settings?.bookingEnabled) {
          setBookingEnabled(true);
        }
        if (tenant.settings?.pacs) {
          setPacsForm({
            orthancUrl: tenant.settings.pacs.orthancUrl || '',
            username: tenant.settings.pacs.username || '',
            password: tenant.settings.pacs.password || '',
          });
        }
      } catch {
        // If tenant fetch fails, keep defaults
      } finally {
        setLoading(false);
      }
    }

    const user = getUser();
    if (user) {
      setProfileUser({ name: user.name, email: user.email });
    }

    fetchTenant();
  }, []);

  // Save clinic details
  const saveClinicDetails = async () => {
    if (!clinicForm.name.trim()) {
      setClinicMsg({ type: 'error', text: 'שם הקליניקה הוא שדה חובה' });
      return;
    }
    setClinicSaving(true);
    setClinicMsg(null);
    try {
      const token = getToken();
      await apiFetch('/tenants/current', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({
          name: clinicForm.name,
          address: clinicForm.address || undefined,
          phone: clinicForm.phone || undefined,
          email: clinicForm.email || undefined,
        }),
      });
      setClinicMsg({ type: 'success', text: 'פרטי הקליניקה עודכנו בהצלחה' });
    } catch (err: any) {
      setClinicMsg({ type: 'error', text: err.message || 'שגיאה בשמירת הפרטים' });
    } finally {
      setClinicSaving(false);
    }
  };

  // Save working hours
  const saveWorkingHours = async () => {
    setHoursSaving(true);
    setHoursMsg(null);
    try {
      const token = getToken();
      await apiFetch('/tenants/current', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ workingHours }),
      });
      setHoursMsg({ type: 'success', text: 'שעות הפעילות עודכנו בהצלחה' });
    } catch (err: any) {
      setHoursMsg({ type: 'error', text: err.message || 'שגיאה בשמירת שעות הפעילות' });
    } finally {
      setHoursSaving(false);
    }
  };

  // Save notifications
  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const token = getToken();
      await apiFetch('/tenants/current', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ notificationSettings: notifications }),
      });
      setNotifMsg({ type: 'success', text: 'הגדרות ההתראות עודכנו בהצלחה' });
    } catch (err: any) {
      setNotifMsg({ type: 'error', text: err.message || 'שגיאה בשמירת הגדרות ההתראות' });
    } finally {
      setNotifSaving(false);
    }
  };

  // Change password
  const savePassword = async () => {
    setProfileMsg(null);
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setProfileMsg({ type: 'error', text: 'יש למלא את כל שדות הסיסמה' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setProfileMsg({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      return;
    }
    setProfileSaving(true);
    try {
      const token = getToken();
      await apiFetch('/auth/change-password', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfileMsg({ type: 'success', text: 'הסיסמה שונתה בהצלחה' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'שגיאה בשינוי הסיסמה' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Save PACS settings
  const savePacsSettings = async () => {
    setPacsSaving(true);
    setPacsMsg(null);
    try {
      const token = getToken();
      await apiFetch('/tenants/current', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ settings: { pacs: pacsForm } }),
      });
      setPacsMsg({ type: 'success', text: 'הגדרות PACS עודכנו בהצלחה' });
    } catch (err: any) {
      setPacsMsg({ type: 'error', text: err.message || 'שגיאה בשמירת ההגדרות' });
    } finally {
      setPacsSaving(false);
    }
  };

  const testPacsConnection = async () => {
    setPacsTesting(true);
    setPacsConnected(null);
    try {
      const token = getToken();
      const res = await apiFetch<{ connected: boolean; version?: string }>('/imaging/pacs/test', { token: token || undefined });
      setPacsConnected(res.connected);
      if (res.connected) {
        setPacsMsg({ type: 'success', text: `חיבור הצליח! Orthanc v${res.version || 'unknown'}` });
      } else {
        setPacsMsg({ type: 'error', text: 'החיבור נכשל — בדוק כתובת והרשאות' });
      }
    } catch {
      setPacsConnected(false);
      setPacsMsg({ type: 'error', text: 'החיבור נכשל' });
    } finally {
      setPacsTesting(false);
    }
  };

  // Save booking settings
  const saveBookingSettings = async () => {
    setBookingSaving(true);
    setBookingMsg(null);
    try {
      const token = getToken();
      await apiFetch('/tenants/current', {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ settings: { bookingEnabled } }),
      });
      setBookingMsg({ type: 'success', text: 'הגדרות ההזמנה עודכנו בהצלחה' });
    } catch (err: any) {
      setBookingMsg({ type: 'error', text: err.message || 'שגיאה בשמירת ההגדרות' });
    } finally {
      setBookingSaving(false);
    }
  };

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${clinicForm.slug}`
    : `/book/${clinicForm.slug}`;

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateWorkingDay = (dayKey: string, field: keyof WorkingHoursEntry, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">הגדרות</h1>
        <div className="py-8 text-center text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">הגדרות</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Clinic Details Tab */}
      {activeTab === 'clinic' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי קליניקה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicMsg && <StatusMessage type={clinicMsg.type} message={clinicMsg.text} />}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>שם הקליניקה *</Label>
                <Input
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  placeholder="לדוגמה: מרפאה וטרינרית שמש"
                />
              </div>
              <div className="space-y-2">
                <Label>מזהה (slug)</Label>
                <Input
                  value={clinicForm.slug}
                  disabled
                  className="bg-gray-50 text-muted-foreground"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                  placeholder="רחוב, עיר"
                />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                  placeholder="clinic@example.com"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-start">
              <Button onClick={saveClinicDetails} disabled={clinicSaving}>
                <Save className="ml-2 h-4 w-4" />
                {clinicSaving ? 'שומר...' : 'שמירת שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              שעות פעילות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hoursMsg && <StatusMessage type={hoursMsg.type} message={hoursMsg.text} />}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="pb-3 font-medium text-muted-foreground">יום</th>
                    <th className="pb-3 font-medium text-muted-foreground">סטטוס</th>
                    <th className="pb-3 font-medium text-muted-foreground">שעת פתיחה</th>
                    <th className="pb-3 font-medium text-muted-foreground">שעת סגירה</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const entry = workingHours[day.key];
                    return (
                      <tr key={day.key} className="border-b last:border-0">
                        <td className="py-3 font-medium">{day.label}</td>
                        <td className="py-3">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={!entry.closed}
                              onChange={(e) => updateWorkingDay(day.key, 'closed', !e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                            <span className="mr-2 text-sm text-muted-foreground">
                              {entry.closed ? 'סגור' : 'פתוח'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3">
                          <Input
                            type="time"
                            value={entry.open}
                            onChange={(e) => updateWorkingDay(day.key, 'open', e.target.value)}
                            disabled={entry.closed}
                            className="w-32"
                            dir="ltr"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            type="time"
                            value={entry.close}
                            onChange={(e) => updateWorkingDay(day.key, 'close', e.target.value)}
                            disabled={entry.closed}
                            className="w-32"
                            dir="ltr"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-start">
              <Button onClick={saveWorkingHours} disabled={hoursSaving}>
                <Save className="ml-2 h-4 w-4" />
                {hoursSaving ? 'שומר...' : 'שמירת שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              הגדרות התראות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifMsg && <StatusMessage type={notifMsg.type} message={notifMsg.text} />}
            <div className="space-y-6">
              {/* SMS Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">תזכורות SMS</p>
                  <p className="text-sm text-muted-foreground">שליחת תזכורות לתורים באמצעות הודעות SMS</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notifications.smsEnabled}
                    onChange={(e) => setNotifications({ ...notifications, smsEnabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                </label>
              </div>

              {/* Email Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">תזכורות אימייל</p>
                  <p className="text-sm text-muted-foreground">שליחת תזכורות לתורים באמצעות דואר אלקטרוני</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notifications.emailEnabled}
                    onChange={(e) => setNotifications({ ...notifications, emailEnabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                </label>
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">תזכורות WhatsApp</p>
                  <p className="text-sm text-muted-foreground">שליחת תזכורות לתורים באמצעות WhatsApp</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notifications.whatsappEnabled}
                    onChange={(e) => setNotifications({ ...notifications, whatsappEnabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                </label>
              </div>

              {/* Reminder Hours */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">זמן תזכורת לפני התור</p>
                    <p className="text-sm text-muted-foreground">כמה שעות לפני התור לשלוח תזכורת</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={72}
                      value={notifications.reminderHoursBefore}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          reminderHoursBefore: parseInt(e.target.value) || 24,
                        })
                      }
                      className="w-20 text-center"
                      dir="ltr"
                    />
                    <span className="text-sm text-muted-foreground">שעות</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-start">
              <Button onClick={saveNotifications} disabled={notifSaving}>
                <Save className="ml-2 h-4 w-4" />
                {notifSaving ? 'שומר...' : 'שמירת שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Tab */}
      {activeTab === 'booking' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              הזמנת תורים אונליין
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingMsg && <StatusMessage type={bookingMsg.type} message={bookingMsg.text} />}
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">אפשר הזמנת תורים אונליין</p>
                  <p className="text-sm text-muted-foreground">
                    לקוחות יוכלו לקבוע תורים דרך קישור ציבורי
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={bookingEnabled}
                    onChange={(e) => setBookingEnabled(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                </label>
              </div>

              {/* Booking URL */}
              {clinicForm.slug && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">קישור ההזמנה הציבורי</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={bookingUrl}
                      readOnly
                      className="bg-gray-50 text-muted-foreground flex-1"
                      dir="ltr"
                    />
                    <Button variant="outline" onClick={copyBookingUrl} className="shrink-0">
                      <Copy className="ml-2 h-4 w-4" />
                      {copied ? 'הועתק!' : 'העתק'}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    שתף קישור זה עם הלקוחות שלך כדי שיוכלו לקבוע תורים בעצמם
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-start">
              <Button onClick={saveBookingSettings} disabled={bookingSaving}>
                <Save className="ml-2 h-4 w-4" />
                {bookingSaving ? 'שומר...' : 'שמירת שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PACS Tab */}
      {activeTab === 'pacs' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorDot className="h-5 w-5" />
              הגדרות PACS / DICOM
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pacsMsg && <StatusMessage type={pacsMsg.type} message={pacsMsg.text} />}
            <p className="mb-4 text-sm text-muted-foreground">
              חבר שרת Orthanc לקבלת תמונות DICOM ממכשירי הדמיה (רנטגן, אולטראסאונד, CT).
              יש להתקין Orthanc בקליניקה ולהזין את פרטי החיבור כאן.
            </p>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>כתובת שרת Orthanc</Label>
                  <Input
                    value={pacsForm.orthancUrl}
                    onChange={(e) => setPacsForm({ ...pacsForm, orthancUrl: e.target.value })}
                    placeholder="http://localhost:8042"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>שם משתמש</Label>
                  <Input
                    value={pacsForm.username}
                    onChange={(e) => setPacsForm({ ...pacsForm, username: e.target.value })}
                    placeholder="orthanc"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>סיסמה</Label>
                  <Input
                    type="password"
                    value={pacsForm.password}
                    onChange={(e) => setPacsForm({ ...pacsForm, password: e.target.value })}
                    placeholder="orthanc"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Connection status */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  pacsConnected === true ? 'bg-green-100' : pacsConnected === false ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {pacsConnected === true ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : pacsConnected === false ? (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  ) : (
                    <MonitorDot className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {pacsConnected === true ? 'מחובר' : pacsConnected === false ? 'לא מחובר' : 'לא נבדק'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    בדוק את החיבור לשרת Orthanc
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={testPacsConnection}
                  disabled={pacsTesting || !pacsForm.orthancUrl}
                >
                  {pacsTesting ? 'בודק...' : 'בדוק חיבור'}
                </Button>
              </div>

              {/* Info box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">תקנים נתמכים:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>DICOM 3.0 — קבלה ושמירה של תמונות רפואיות</li>
                  <li>DICOMweb (WADO-RS) — צפייה בתמונות דרך הדפדפן</li>
                  <li>C-STORE — קבלת תמונות ממכשירי הדמיה</li>
                  <li>C-FIND / C-MOVE — חיפוש וחילוץ חקירות</li>
                  <li>Stone Web Viewer — צופה DICOM מובנה</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-start">
              <Button onClick={savePacsSettings} disabled={pacsSaving}>
                <Save className="ml-2 h-4 w-4" />
                {pacsSaving ? 'שומר...' : 'שמירת שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטי משתמש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>שם</Label>
                  <Input value={profileUser.name} disabled className="bg-gray-50 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>אימייל</Label>
                  <Input
                    value={profileUser.email}
                    disabled
                    className="bg-gray-50 text-muted-foreground"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>שינוי סיסמה</CardTitle>
            </CardHeader>
            <CardContent>
              {profileMsg && <StatusMessage type={profileMsg.type} message={profileMsg.text} />}
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label>סיסמה נוכחית</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>סיסמה חדשה</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>אישור סיסמה חדשה</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-start">
                <Button onClick={savePassword} disabled={profileSaving}>
                  <Save className="ml-2 h-4 w-4" />
                  {profileSaving ? 'שומר...' : 'שינוי סיסמה'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
