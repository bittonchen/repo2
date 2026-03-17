'use client';

import { getUser, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const user = getUser();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">{user?.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="יציאה">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
