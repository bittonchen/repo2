'use client';

const TOKEN_KEY = 'vetflow_token';
const USER_KEY = 'vetflow_user';
const LAST_ACTIVITY_KEY = 'vetflow_last_activity';
const SESSION_START_KEY = 'vetflow_session_start';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  if (!localStorage.getItem(SESSION_START_KEY)) {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_START_KEY);
  window.location.href = '/';
}

export function isAuthenticated(): boolean {
  if (!getToken()) return false;

  // Check idle timeout
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed > IDLE_TIMEOUT_MS) {
      logout();
      return false;
    }
  }

  // Check absolute timeout
  const sessionStart = localStorage.getItem(SESSION_START_KEY);
  if (sessionStart) {
    const elapsed = Date.now() - parseInt(sessionStart, 10);
    if (elapsed > ABSOLUTE_TIMEOUT_MS) {
      logout();
      return false;
    }
  }

  return true;
}

export function trackActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

let activityListenersAttached = false;

export function setupActivityTracking(): () => void {
  if (typeof window === 'undefined' || activityListenersAttached) return () => {};
  activityListenersAttached = true;

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const handler = () => trackActivity();

  events.forEach((event) => window.addEventListener(event, handler, { passive: true }));

  // Periodic check every minute
  const interval = setInterval(() => {
    if (!isAuthenticated()) {
      logout();
    }
  }, 60000);

  return () => {
    activityListenersAttached = false;
    events.forEach((event) => window.removeEventListener(event, handler));
    clearInterval(interval);
  };
}
