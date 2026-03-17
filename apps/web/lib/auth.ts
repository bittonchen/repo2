'use client';

const TOKEN_KEY = 'vetflow_token';
const USER_KEY = 'vetflow_user';

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
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
