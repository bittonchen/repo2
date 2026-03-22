'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { hasAccess } from '@/lib/roles';
import { useTranslation } from '@/lib/i18n';
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
  CreditCard,
  ShieldCheck,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/clients', labelKey: 'nav.clients', icon: Users },
  { href: '/animals', labelKey: 'nav.animals', icon: PawPrint },
  { href: '/appointments', labelKey: 'nav.appointments', icon: Calendar },
  { href: '/inventory', labelKey: 'nav.inventory', icon: Package },
  { href: '/employees', labelKey: 'nav.employees', icon: UserCog },
  { href: '/reminders', labelKey: 'nav.reminders', icon: Bell },
  { href: '/messages', labelKey: 'nav.messages', icon: MessageSquare },
  { href: '/pos', labelKey: 'nav.pos', icon: Receipt },
  { href: '/quotes', labelKey: 'nav.quotes', icon: FileText },
  { href: '/finance', labelKey: 'nav.finance', icon: TrendingUp },
  { href: '/templates', labelKey: 'nav.templates', icon: ClipboardList },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
  { href: '/subscription', labelKey: 'nav.subscription', icon: CreditCard },
  { href: '/admin', labelKey: 'nav.admin', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, dir } = useTranslation();
  const visibleItems = navItems.filter((item) => hasAccess(item.href));
  const isRtl = dir === 'rtl';

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
          VetFlow
        </Link>
        <button className="md:hidden p-1" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-gray-500" />
        </button>
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
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={cn(
          'fixed top-4 z-40 rounded-lg border bg-white p-2 shadow-sm md:hidden',
          isRtl ? 'right-4' : 'left-4',
        )}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-50 flex h-screen w-64 flex-col bg-white transition-transform duration-200 md:hidden',
          isRtl ? 'right-0' : 'left-0',
          isRtl
            ? mobileOpen ? 'translate-x-0' : 'translate-x-full'
            : mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-30 hidden h-screen w-64 flex-col bg-white md:flex',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export function useSidebarMobileOpen() {
  return useState(false);
}
