import type { ApiResponse } from '@streambrws/shared-types';

let baseUrl = 'http://localhost:4000/api';
let accessToken: string | null = null;

export function configureClient(url: string) {
  baseUrl = url;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  try {
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    return { ok: false, error: 'Network error', code: 'NETWORK_ERROR', details: err };
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
