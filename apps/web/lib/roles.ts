'use client';

import { getUser } from '@/lib/auth';

export type UserRole = 'owner' | 'admin' | 'veterinarian' | 'technician' | 'receptionist';

const rolePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['owner', 'admin', 'veterinarian', 'technician', 'receptionist'],
  '/clients': ['owner', 'admin', 'veterinarian', 'technician', 'receptionist'],
  '/animals': ['owner', 'admin', 'veterinarian', 'technician', 'receptionist'],
  '/appointments': ['owner', 'admin', 'veterinarian', 'technician', 'receptionist'],
  '/inventory': ['owner', 'admin', 'veterinarian', 'technician'],
  '/employees': ['owner', 'admin'],
  '/reminders': ['owner', 'admin', 'veterinarian', 'receptionist'],
  '/messages': ['owner', 'admin', 'receptionist'],
  '/pos': ['owner', 'admin', 'receptionist'],
  '/quotes': ['owner', 'admin', 'receptionist'],
  '/finance': ['owner', 'admin'],
  '/admin': ['owner', 'admin'],
  '/settings': ['owner', 'admin'],
};

export function hasAccess(path: string): boolean {
  const user = getUser();
  if (!user) return false;

  const role = user.role as UserRole;

  // Owner and admin have access to everything
  if (role === 'owner' || role === 'admin') return true;

  const allowedRoles = rolePermissions[path];
  if (!allowedRoles) return true; // Unknown paths are accessible by default

  return allowedRoles.includes(role);
}

export function getAccessiblePaths(): string[] {
  const user = getUser();
  if (!user) return [];

  const role = user.role as UserRole;
  if (role === 'owner' || role === 'admin') return Object.keys(rolePermissions);

  return Object.entries(rolePermissions)
    .filter(([, roles]) => roles.includes(role))
    .map(([path]) => path);
}

export function getCurrentRole(): UserRole | null {
  const user = getUser();
  return user ? (user.role as UserRole) : null;
}
