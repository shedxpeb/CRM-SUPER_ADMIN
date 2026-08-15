import { api, buildQueryString } from '../api';
import type { ModuleCatalogEntry, Paginated, PlatformSetting } from '../types';

export async function getModuleCatalog(): Promise<ModuleCatalogEntry[]> {
  const res = await api.get<ModuleCatalogEntry[]>('/platform/modules');
  return res.data;
}

export async function getPlatformSettings(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
}): Promise<Paginated<PlatformSetting>> {
  const res = await api.get<PlatformSetting[]>(`/platform/settings${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function updatePlatformSetting(
  key: string,
  input: { value: unknown; description?: string },
): Promise<PlatformSetting> {
  const res = await api.patch<PlatformSetting>(`/platform/settings/${key}`, input);
  return res.data;
}
