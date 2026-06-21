import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#0a0010', borderTopColor: '#2d0050' },
      tabBarActiveTintColor: '#9b30ff',
      tabBarInactiveTintColor: '#555',
    }}>
      <Tabs.Screen name="index"    options={{ title: 'Home',      tabBarIcon: ({ color, size }) => <Ionicons name="home"     size={size} color={color} /> }} />
      <Tabs.Screen name="search"   options={{ title: 'Search',    tabBarIcon: ({ color, size }) => <Ionicons name="search"   size={size} color={color} /> }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist', tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings',  tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
