'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-8 pb-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold">משהו השתבש</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {error.message || 'אירעה שגיאה בלתי צפויה'}
          </p>
          <div className="flex gap-3">
            <Button onClick={reset}>נסה שוב</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">חזרה לדשבורד</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
