'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken, logout } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Search,
  Bell,
  Globe,
  X,
  User,
  LogOut,
  Package,
  Calendar,
  PawPrint,
  Users,
} from 'lucide-react';

/* ---------- Types ---------- */

interface SearchResult {
  clients?: Array<{ id: string; name: string; phone?: string }>;
  animals?: Array<{ id: string; name: string; species?: string }>;
  inventory?: Array<{ id: string; name: string; sku?: string }>;
}

interface Notification {
  id: string;
  type: 'low_stock' | 'unconfirmed_appointment' | 'pending_reminder';
  title: string;
  message: string;
  created_at?: string;
}

/* ---------- Component ---------- */

export function Header() {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();

  useEffect(() => {
    setUser(getUser());
    setTokenState(getToken());
  }, []);

  /* --- Search state --- */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Notifications state --- */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  /* ========== Search logic ========== */

  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults(null);
        setSearchOpen(false);
        return;
      }
      try {
        const data = await apiFetch<SearchResult>(`/search?q=${encodeURIComponent(q)}`, {
          token: token || undefined,
        });
        setSearchResults(data);
        setSearchOpen(true);
      } catch {
        setSearchResults(null);
      }
    },
    [token],
  );

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  // Close search dropdown on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  /* ========== Notifications logic ========== */

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<Notification[]>('/admin/notifications', {
        token: token || undefined,
      });
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* ========== Helpers ========== */

  const navigateTo = (path: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'unconfirmed_appointment':
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case 'pending_reminder':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const notifBadgeColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'bg-red-50';
      case 'unconfirmed_appointment':
        return 'bg-yellow-50';
      case 'pending_reminder':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const hasResults =
    searchResults &&
    ((searchResults.clients?.length ?? 0) > 0 ||
      (searchResults.animals?.length ?? 0) > 0 ||
      (searchResults.inventory?.length ?? 0) > 0);

  /* ========== Render ========== */

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Spacer for mobile hamburger */}
      <div className="w-10 md:w-0" />

      {/* Global Search */}
      <div ref={searchRef} className="relative mx-4 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('header.search_placeholder')}
            className="w-full rounded-lg border bg-gray-50 py-2 pe-3 ps-10 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setSearchOpen(false);
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchOpen && searchResults && (
          <div className="absolute start-0 top-full z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
            {!hasResults ? (
              <div className="p-4 text-center text-sm text-gray-500">{t('search.no_results')}</div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2">
                {/* Clients */}
                {(searchResults.clients?.length ?? 0) > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase text-gray-400">
                      <Users className="h-3 w-3" />
                      {t('search.clients')}
                    </div>
                    {searchResults.clients!.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigateTo(`/clients/${c.id}`)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{c.name}</span>
                        {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Animals */}
                {(searchResults.animals?.length ?? 0) > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase text-gray-400">
                      <PawPrint className="h-3 w-3" />
                      {t('search.animals')}
                    </div>
                    {searchResults.animals!.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => navigateTo(`/animals/${a.id}`)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <PawPrint className="h-4 w-4 text-gray-400" />
                        <span>{a.name}</span>
                        {a.species && <span className="text-xs text-gray-400">{a.species}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Inventory */}
                {(searchResults.inventory?.length ?? 0) > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase text-gray-400">
                      <Package className="h-3 w-3" />
                      {t('search.inventory')}
                    </div>
                    {searchResults.inventory!.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => navigateTo(`/inventory`)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{inv.name}</span>
                        {inv.sku && <span className="text-xs text-gray-400">{inv.sku}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
          title={locale === 'he' ? 'English' : 'עברית'}
          className="text-xs font-semibold"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{locale === 'he' ? 'EN' : 'עב'}</span>
        </Button>

        {/* Notifications bell */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen((o) => !o)}
            title={t('header.notifications')}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute end-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg">
              <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700">
                {t('header.notifications')}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {t('header.no_notifications')}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 border-b px-4 py-3 last:border-b-0 ${notifBadgeColor(n.type)}`}
                    >
                      <div className="mt-0.5">{notifIcon(n.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-800">{n.title}</div>
                        <div className="text-xs text-gray-500">{n.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span className="hidden text-gray-700 md:inline">{user?.name}</span>
        </div>

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={logout} title={t('header.logout')}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
