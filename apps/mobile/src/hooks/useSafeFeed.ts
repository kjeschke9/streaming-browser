import { useState, useCallback } from 'react';
import { profileApi } from '@streambrws/shared-logic';
import { useSafeFeedStore } from '../store';

export function useSafeFeed() {
  const { enabled, hasPinSet, isUnlocked, setEnabled, setUnlocked, setHasPinSet } = useSafeFeedStore();
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    setVerifyError(null);
    const res = await profileApi.verifyPIN(pin);
    if (res.ok && res.data.valid) {
      setUnlocked(true);
      return true;
    }
    setVerifyError('Incorrect PIN');
    return false;
  }, []);

  const setPin = useCallback(async (pin: string): Promise<boolean> => {
    const res = await profileApi.setPIN(pin);
    if (res.ok) {
      setHasPinSet(true);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => setUnlocked(false), []);

  const toggleSafeFeed = useCallback(async (value: boolean) => {
    if (value && !hasPinSet) return false; // Must set PIN first
    const res = await profileApi.updateSafeFeed({ enabled: value });
    if (res.ok) { setEnabled(value); return true; }
    return false;
  }, [hasPinSet]);

  return { enabled, hasPinSet, isUnlocked, verifyError, verifyPin, setPin, lock, toggleSafeFeed };
}
