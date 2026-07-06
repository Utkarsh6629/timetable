// Typed API client — all requests use relative URLs so Vite proxy
// handles dev routing and Nginx handles production routing.

import type { TimetableTask, DayRecord, UserPreferences } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  status: 'pending' | 'approved' | 'denied';
  isAdmin: boolean;
}

export interface UserDataPayload {
  timetable: TimetableTask[] | null;
  dayRecords: Record<string, DayRecord>;
  preferences: UserPreferences;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  status: 'pending' | 'approved' | 'denied';
  isAdmin: boolean;
  createdAt: number; // unix seconds
}

/** Key used to store the JWT on native Android (no shared cookie jar). */
export const NATIVE_TOKEN_KEY = 'lp_native_token';

/**
 * On native Android, Capacitor loads files from file:// so relative fetch()
 * calls resolve to capacitor://localhost/... which doesn't exist.
 * We prefix all paths with the production server URL when running natively.
 * On web (dev + production), we keep '' so Vite proxy / Nginx handles routing.
 */
const isNative = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch { return false; }
};
const API_BASE = isNative() ? 'https://utkarsh-planner.duckdns.org' : '';

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // On native: read stored JWT and send as Bearer header.
  const nativeToken = localStorage.getItem(NATIVE_TOKEN_KEY);
  const authHeader: HeadersInit = nativeToken
    ? { Authorization: `Bearer ${nativeToken}` }
    : {};

  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...authHeader, ...(init?.headers ?? {}) },
  });
}


// ── Auth ──────────────────────────────────────────────────────────────────────

/** Returns the current user from the JWT cookie, or null if unauthenticated. */
export async function getMe(): Promise<User | null> {
  try {
    const res = await apiFetch('/auth/me');
    if (!res.ok) return null;
    return res.json() as Promise<User>;
  } catch {
    return null;
  }
}

/** Clears the lp_session cookie on the server. */
export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

// ── User Data ─────────────────────────────────────────────────────────────────

/** Fetches the user's stored timetable/dayRecords/preferences. */
export async function getUserData(): Promise<UserDataPayload | null> {
  try {
    const res = await apiFetch('/api/user-data');
    if (!res.ok) return null;
    return res.json() as Promise<UserDataPayload>;
  } catch {
    return null;
  }
}

/** Upserts the full state blob. Debounced by the caller. */
export async function putUserData(data: UserDataPayload): Promise<void> {
  await apiFetch('/api/user-data', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Lists all users — admin only. */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await apiFetch('/api/admin/users');
    if (!res.ok) return [];
    return res.json() as Promise<AdminUser[]>;
  } catch {
    return [];
  }
}

/** Updates a user's access status — admin only. */
export async function patchUserStatus(
  id: string,
  status: 'approved' | 'denied' | 'pending',
): Promise<void> {
  await apiFetch(`/api/admin/users/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status }),
  });
}
