'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    clinicName: '',
    clinicSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'clinicName' && !form.clinicSlug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05FF\s-]/g, '')
        .replace(/[\s\u0590-\u05FF]+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setForm((prev) => ({ ...prev, clinicSlug: slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setToken(res.token);
      setUser(res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">VetFlow</CardTitle>
          <CardDescription>הרשמת קליניקה חדשה</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                placeholder='ד"ר ישראל ישראלי'
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="לפחות 8 תווים"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={8}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                placeholder="050-1234567"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicName">שם הקליניקה</Label>
              <Input
                id="clinicName"
                placeholder="הקליניקה הוטרינרית"
                value={form.clinicName}
                onChange={(e) => updateField('clinicName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicSlug">כתובת ייחודית (באנגלית)</Label>
              <Input
                id="clinicSlug"
                placeholder="my-clinic"
                value={form.clinicSlug}
                onChange={(e) => updateField('clinicSlug', e.target.value)}
                required
                dir="ltr"
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-xs text-muted-foreground">
                אותיות קטנות באנגלית, מספרים ומקפים בלבד
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'נרשם...' : 'הרשמה'}
            </Button>
            <p className="text-sm text-muted-foreground">
              כבר יש לכם חשבון?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                התחברות
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
