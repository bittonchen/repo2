import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-8 pb-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileQuestion className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold">הדף לא נמצא</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            הדף שחיפשת אינו קיים או שהוסר
          </p>
          <Button asChild>
            <Link href="/dashboard">חזרה לדשבורד</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
