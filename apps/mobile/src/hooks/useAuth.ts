import { useState, useCallback } from 'react';
import { authApi, profileApi, setAccessToken } from '@streambrws/shared-logic';
import { useAuthStore, useExclusionStore, useSafeFeedStore } from '../store';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const { setTokens, setUser, logout: storeLogout } = useAuthStore();
  const loadExclusions = useExclusionStore((s) => s.loadFromProfile);
  const loadSafeFeed   = useSafeFeedStore((s) => s.loadFromProfile);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const res = await authApi.login({ email, password });
      if (!res.ok) throw new Error(res.error);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setAccessToken(res.data.accessToken);
      const profileRes = await profileApi.getProfile();
      if (profileRes.ok) {
        setUser(profileRes.data);
        loadExclusions(profileRes.data);
        loadSafeFeed(profileRes.data);
      }
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setLoading(true); setError(null);
    try {
      const res = await authApi.register({ email, password, displayName });
      if (!res.ok) throw new Error(res.error);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setAccessToken(res.data.accessToken);
      const profileRes = await profileApi.getProfile();
      if (profileRes.ok) {
        setUser(profileRes.data);
        loadExclusions(profileRes.data);
        loadSafeFeed(profileRes.data);
      }
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) await authApi.logout();
    setAccessToken(null);
    storeLogout();
  }, []);

  return { login, register, logout, loading, error };
}
