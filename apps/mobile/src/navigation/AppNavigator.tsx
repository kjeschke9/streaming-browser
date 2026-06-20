/**
 * AppNavigator.tsx — root navigation tree (updated v3).
 *
 * Changes from v2:
 *   + TitleDetail screen added to Root stack (accessible from any tab)
 *   + Onboarding screen added (shown when isOnboarding flag set in auth slice)
 *   + About screen added to Settings stack
 *   + Splash screen added for hydration delay
 */

import React                        from 'react';
import { NavigationContainer }      from '@react-navigation/native';
import {
  createNativeStackNavigator,
}                                   from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
}                                   from '@react-navigation/bottom-tabs';
import { Text }                     from 'react-native';
import { useSelector }              from 'react-redux';
import type { RootState }           from '../store';

import { colors }                   from '@streaming/tokens';

// Screens
import LoginScreen                  from '../screens/LoginScreen';
import SignupScreen                 from '../screens/SignupScreen';
import HomeScreen                   from '../screens/HomeScreen';
import SearchScreen                 from '../screens/SearchScreen';
import ServicesScreen               from '../screens/ServicesScreen';
import SettingsHomeScreen           from '../screens/SettingsHomeScreen';
import SafeFeedSettingsScreen       from '../screens/SafeFeedSettingsScreen';
import SafeFeedPinScreenWrapper     from '../screens/SafeFeedPinScreen';
import HiddenContentManagerScreen   from '../screens/HiddenContentManagerScreen';
import SyncStatusScreen             from '../screens/SyncStatusScreen';
import AboutScreen                  from '../screens/AboutScreen';
import TitleDetailScreen            from '../screens/TitleDetailScreen';
import OnboardingScreen             from '../screens/OnboardingScreen';

// Navigation types
import type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  SettingsStackParamList,
} from './types';

// ─── Stack navigators ─────────────────────────────────────────────────────────

const RootStack     = createNativeStackNavigator<RootStackParamList>();
const AuthStack     = createNativeStackNavigator<AuthStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab           = createBottomTabNavigator<MainTabParamList>();

// ─── Auth navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"  component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Settings stack ───────────────────────────────────────────────────────────

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle:       { backgroundColor: colors.bg[900] },
        headerTintColor:   colors.text[50],
        headerTitleStyle:  { fontWeight: '700' },
        headerBackTitle:   '',
      }}
    >
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="SafeFeedSettings"
        component={SafeFeedSettingsScreen}
        options={{ title: 'Safe-Feed' }}
      />
      <SettingsStack.Screen
        name="SafeFeedPin"
        component={SafeFeedPinScreenWrapper}
        options={{ title: 'Safe-Feed PIN' }}
      />
      <SettingsStack.Screen
        name="HiddenContentManager"
        component={HiddenContentManagerScreen}
        options={{ title: 'Hidden Content' }}
      />
      <SettingsStack.Screen
        name="SyncStatus"
        component={SyncStatusScreen}
        options={{ title: 'Sync Status' }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About StreamHub' }}
      />
    </SettingsStack.Navigator>
  );
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home:     { active: '🏠', inactive: '🏠' },
  Search:   { active: '🔍', inactive: '🔍' },
  Services: { active: '📺', inactive: '📺' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg[900],
          borderTopColor:  colors.bg[800],
        },
        tabBarActiveTintColor:   colors.brand.purple,
        tabBarInactiveTintColor: colors.text[500],
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name] ?? { active: '●', inactive: '○' };
          return (
            <Text style={{ fontSize: size * 0.75 }}>
              {focused ? icons.active : icons.inactive}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}        options={{ title: 'Home' }} />
      <Tab.Screen name="Search"   component={SearchScreen}      options={{ title: 'Search' }} />
      <Tab.Screen name="Services" component={ServicesScreen}    options={{ title: 'Services' }} />
      <Tab.Screen name="Settings" component={SettingsNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { hydrated, status, isOnboarding } =
    useSelector((s: RootState) => s.auth);

  // While auth state is being loaded from SecureStore, show nothing
  if (!hydrated) return null;

  const isAuthenticated = status === 'authenticated';

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Not logged in
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : isOnboarding ? (
          // Logged in but hasn't done first-run setup
          <RootStack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            initialParams={undefined}
          />
        ) : (
          // Fully authenticated + onboarded
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="TitleDetail"
              component={TitleDetailScreen}
              options={{
                headerShown:      true,
                headerTitle:      '',
                headerTransparent: true,
                headerTintColor:  '#fff',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
