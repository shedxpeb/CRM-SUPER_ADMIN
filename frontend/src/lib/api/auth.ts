import { api } from '../api';

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await api.post<import('../types').LoginResponse>('/auth/login', { email, password });
  return res.data;
}

export async function refreshToken() {
  const res = await api.post<import('../types').LoginResponse>('/auth/refresh', {});
  return res.data;
}

export async function getMe() {
  const res = await api.get<import('../types').AuthUser>('/auth/me');
  return res.data;
}

export async function logout() {
  await api.post('/auth/logout');
}

