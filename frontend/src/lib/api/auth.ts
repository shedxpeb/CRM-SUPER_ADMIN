import { api, buildQueryString } from '../api';
import type { LoginAttempt } from '../types';

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await api.post<import('../types').LoginResponse>('/auth/login', { email, password });
  return res.data;
}

export async function refreshToken(refreshToken?: string) {
  const res = await api.post<import('../types').LoginResponse>('/auth/refresh', refreshToken ? { refreshToken } : {});
  return res.data;
}

export async function getMe() {
  const res = await api.get<import('../types').AuthUser>('/auth/me');
  return res.data;
}

export async function logout() {
  await api.post('/auth/logout');
}

// ── Login attempts (security) ────────────────────────────────────────────────

export async function getLoginAttempts(params?: {
  page?: number;
  pageSize?: number;
  email?: string;
  success?: string;
}) {
  const res = await api.get<LoginAttempt[]>(`/security/login-attempts${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta };
}
