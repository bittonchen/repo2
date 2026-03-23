'use client';

import { useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, RotateCcw } from 'lucide-react';

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const clinicName = searchParams.get('clinicName') || '';
  const clinicAddress = searchParams.get('clinicAddress') || '';
  const type = searchParams.get('type') || '';
  const veterinarian = searchParams.get('veterinarian') || '';
  const startTime = searchParams.get('startTime') || '';
  const animalName = searchParams.get('animalName') || '';
  const clientName = searchParams.get('clientName') || '';

  const date = startTime ? new Date(startTime) : null;
  const formattedDate = date
    ? date.toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const formattedTime = date
    ? date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';

  const googleCalendarUrl = date
    ? (() => {
        const endTime = new Date(date.getTime() + 30 * 60 * 1000);
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const params = new URLSearchParams({
          action: 'TEMPLATE',
          text: `${type} - ${animalName} | ${clinicName}`,
          dates: `${fmt(date)}/${fmt(endTime)}`,
          details: `לקוח: ${clientName}\nחיה: ${animalName}\nוטרינר: ${veterinarian}`,
          location: clinicAddress || '',
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
      })()
    : '';

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {clinicName && (
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-800">{clinicName}</h2>
          {clinicAddress && (
            <p className="text-sm text-gray-500">{clinicAddress}</p>
          )}
        </div>
      )}

      <Card>
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            התור נקבע בהצלחה!
          </h1>
          <p className="mb-6 text-gray-500">פרטי התור שלך:</p>

          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 text-right text-sm">
            {type && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{type}</span>
                <span className="text-gray-500">סוג ביקור</span>
              </div>
            )}
            {veterinarian && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{veterinarian}</span>
                <span className="text-gray-500">וטרינר</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{formattedDate}</span>
                <span className="text-gray-500">תאריך</span>
              </div>
            )}
            {formattedTime && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{formattedTime}</span>
                <span className="text-gray-500">שעה</span>
              </div>
            )}
            {animalName && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{animalName}</span>
                <span className="text-gray-500">חיה</span>
              </div>
            )}
            {clientName && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{clientName}</span>
                <span className="text-gray-500">לקוח</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {googleCalendarUrl && (
              <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Calendar className="ml-2 h-4 w-4" />
                  הוסף ל-Google Calendar
                </Button>
              </a>
            )}
            <Link href={`/book/${slug}`}>
              <Button variant="outline" className="w-full">
                <RotateCcw className="ml-2 h-4 w-4" />
                קבע תור נוסף
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
