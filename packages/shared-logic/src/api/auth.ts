import type { AuthTokens, LoginRequest, RegisterRequest, ApiResponse } from '@streambrws/shared-types';
import { apiClient } from './client';

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<AuthTokens>('/auth/login', body),

  register: (body: RegisterRequest) =>
    apiClient.post<AuthTokens>('/auth/register', body),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post<void>('/auth/logout', {}),
};
