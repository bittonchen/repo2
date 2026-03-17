import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h1 className="mb-4 text-5xl font-bold text-blue-600">
          VetFlow
        </h1>
        <p className="mb-2 text-2xl text-gray-700">
          מערכת ניהול קליניקות וטרינריות
        </p>
        <p className="mb-8 text-lg text-gray-500">
          נהלו את הקליניקה שלכם בקלות — לקוחות, חיות, תורים, מלאי, חשבוניות והכל במקום אחד
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition hover:bg-blue-700"
          >
            התחברות
          </Link>
          <Link
            href="/register"
            className="rounded-lg border-2 border-blue-600 px-8 py-3 text-lg font-medium text-blue-600 transition hover:bg-blue-50"
          >
            הרשמה
          </Link>
        </div>
      </div>
    </div>
  );
}
