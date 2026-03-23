'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { isAuthenticated, setupActivityTracking } from '@/lib/auth';
import { hasAccess } from '@/lib/roles';
import { I18nProvider, useTranslation } from '@/lib/i18n';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir } = useTranslation();
  const isRtl = dir === 'rtl';

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (!hasAccess(pathname)) {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  // Setup idle/absolute timeout tracking
  useEffect(() => {
    const cleanup = setupActivityTracking();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <Sidebar />
      <div className={isRtl ? 'md:mr-64' : 'md:ml-64'}>
        <Header />
        <main className="p-3 pt-16 md:p-6 md:pt-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <DashboardContent>{children}</DashboardContent>
    </I18nProvider>
  );
}
