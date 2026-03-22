'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { hasAccess } from '@/lib/roles';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Package,
  UserCog,
  Bell,
  MessageSquare,
  Receipt,
  FileText,
  TrendingUp,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/clients', label: 'לקוחות', icon: Users },
  { href: '/animals', label: 'חיות', icon: PawPrint },
  { href: '/appointments', label: 'תורים', icon: Calendar },
  { href: '/inventory', label: 'מלאי', icon: Package },
  { href: '/employees', label: 'עובדים', icon: UserCog },
  { href: '/reminders', label: 'תזכורות', icon: Bell },
  { href: '/messages', label: 'הודעות', icon: MessageSquare },
  { href: '/pos', label: 'קופה', icon: Receipt },
  { href: '/quotes', label: 'הצעות מחיר', icon: FileText },
  { href: '/finance', label: 'פיננסי', icon: TrendingUp },
  { href: '/admin', label: 'ניהול', icon: ShieldCheck },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => hasAccess(item.href));

  return (
    <aside className="fixed right-0 top-0 z-30 flex h-screen w-64 flex-col border-l bg-white">
      <div className="flex h-16 items-center justify-center border-b">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
          VetFlow
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
