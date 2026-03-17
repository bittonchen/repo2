'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          לקוח חדש
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם, טלפון או אימייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right">
                  <th className="pb-3 font-medium text-muted-foreground">שם</th>
                  <th className="pb-3 font-medium text-muted-foreground">טלפון</th>
                  <th className="pb-3 font-medium text-muted-foreground">אימייל</th>
                  <th className="pb-3 font-medium text-muted-foreground">חיות</th>
                  <th className="pb-3 font-medium text-muted-foreground">פעולות</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    אין לקוחות עדיין. הוסיפו את הלקוח הראשון!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
