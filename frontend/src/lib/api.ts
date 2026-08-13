const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const API_PREFIX = '/api/v1';
export const ACCESS_TOKEN_KEY = 'sa_access_token';
export const REFRESH_TOKEN_KEY = 'sa_refresh_token';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  requestId: string;
  timestamp: string;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export class ApiError extends Error {
  status: number;
  requestId?: string;
  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retried = false,
): Promise<ApiEnvelope<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${API_PREFIX}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !retried) {
    handleUnauthorized();
    throw new ApiError('Unauthorized', 401);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body?.message || body?.error || body?.code || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body?.requestId);
  }

  return body as ApiEnvelope<T>;
}

export const api = {
  get: <T = unknown>(endpoint: string) => request<T>(endpoint),
  post: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  put: <T = unknown>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export function buildQueryString(params?: object): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
