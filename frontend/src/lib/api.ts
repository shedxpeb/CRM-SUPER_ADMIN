const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_PREFIX = '/api/v1';
export const ACCESS_TOKEN_KEY = 'sa_access_token';

// Fail fast instead of silently pointing the production bundle at localhost.
if (!API_URL) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_API_URL (e.g. https://api.example.com/api/v1)',
  );
}

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
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function attemptRefresh(): Promise<string | null> {
  try {
    // The refresh token lives in an httpOnly cookie set by the backend;
    // credentials: 'include' sends it automatically. Never store it in
    // localStorage (XSS-safe).
    const res = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    const data = body?.data ?? body;
    if (!data?.accessToken) return null;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Single-flight refresh: concurrent 401s share one refresh call. */
let refreshInFlight: Promise<string | null> | null = null;
function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = attemptRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
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

  // Refresh once on 401 (never for the auth endpoints themselves, to avoid a loop),
  // then retry the original request with the new access token.
  const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/refresh';
  if (res.status === 401 && !retried && !isAuthEndpoint) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, options, true);
    }
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
