import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initApiClient, syncTokenToClient } from './src/services/api';
import { useAutoSync } from './src/hooks/useAutoSync';

function Root() {
  useAutoSync();
  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    initApiClient();
    syncTokenToClient();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1A0008" />
      <Root />
    </SafeAreaProvider>
  );
}
