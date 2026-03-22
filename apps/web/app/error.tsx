'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6" dir="rtl">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold">משהו השתבש</h2>
          <p className="mb-6 text-sm text-gray-500">
            {error.message || 'אירעה שגיאה בלתי צפויה'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              נסה שוב
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
