import { authApi, profileApi, setAccessToken, configureClient } from '@streambrws/shared-logic';
import { useTizenStore } from '../tizenStore';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:4000/api';
configureClient(API_BASE);

export function useTizenAuth() {
  const { setTokens, setUser, logout: storeLogout, loadFromProfile, setScreen, accessToken } = useTizenStore();

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await authApi.login({ email, password });
    if (!res.ok) return { ok: false, error: res.error };
    setTokens(res.data.accessToken, res.data.refreshToken);
    setAccessToken(res.data.accessToken);
    const profileRes = await profileApi.getProfile();
    if (profileRes.ok) {
      loadFromProfile(profileRes.data);
    }
    setScreen('home');
    return { ok: true };
  };

  const logout = async () => {
    setAccessToken(null);
    storeLogout();
    setScreen('login');
  };

  const initFromStorage = () => {
    const token = useTizenStore.getState().accessToken;
    if (token) {
      setAccessToken(token);
      setScreen('home');
    }
  };

  return { login, logout, initFromStorage };
}
