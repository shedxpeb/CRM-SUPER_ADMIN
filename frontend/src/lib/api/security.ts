import { api, buildQueryString } from '../api';
import type {
  BlockedIp,
  Paginated,
  PlatformSession,
} from '../types';

export async function getBlockedIps(params?: {
  page?: number;
  pageSize?: number;
  active?: boolean | string;
}): Promise<Paginated<BlockedIp>> {
  const res = await api.get<BlockedIp[]>(`/security/blocked-ips${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function createBlockedIp(input: {
  ipAddress: string;
  reason?: string;
  blockedUntil?: string;
}): Promise<BlockedIp> {
  const res = await api.post<BlockedIp>('/security/blocked-ips', input);
  return res.data;
}

export async function unblockIp(id: string): Promise<BlockedIp> {
  const res = await api.post<BlockedIp>(`/security/blocked-ips/${id}/unblock`);
  return res.data;
}

export async function getSessions(params?: {
  page?: number;
  pageSize?: number;
}): Promise<Paginated<PlatformSession>> {
  const res = await api.get<PlatformSession[]>(`/security/sessions${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function revokeSession(id: string): Promise<PlatformSession> {
  const res = await api.post<PlatformSession>(`/security/sessions/${id}/revoke`);
  return res.data;
}
