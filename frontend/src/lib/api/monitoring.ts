import { api, buildQueryString } from '../api';
import type {
  AuditLogEntry,
  Paginated,
  SystemLog,
} from '../types';

export async function getAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  action?: string;
  actorEmail?: string;
  tenantId?: string;
  severity?: string;
}): Promise<Paginated<AuditLogEntry>> {
  const res = await api.get<AuditLogEntry[]>(`/audit-logs${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function getSystemLogs(params?: {
  page?: number;
  pageSize?: number;
  level?: string;
  component?: string;
}): Promise<Paginated<SystemLog>> {
  const res = await api.get<SystemLog[]>(`/monitoring/system-logs${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function getErrors(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  service?: string;
}): Promise<Paginated<import('../types').PlatformError>> {
  const res = await api.get<import('../types').PlatformError[]>(`/errors${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}
