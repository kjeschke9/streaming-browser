import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then((t) => {
      setToken(t);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    else if (token && inAuth) router.replace('/(tabs)');
  }, [ready, token, segments]);

  if (!ready) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0010' }}>
      <ActivityIndicator color="#9b30ff" size="large" />
    </View>
  );

  return <Slot />;
}
