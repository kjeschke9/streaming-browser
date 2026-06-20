import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Alert, Dimensions,
} from 'react-native';
import { useAuthStore } from '../store';
import { LoginScreen }       from '../screens/LoginScreen';
import { RegisterScreen }    from '../screens/RegisterScreen';
import { HomeScreen }        from '../screens/HomeScreen';
import { SearchScreen }      from '../screens/SearchScreen';
import { SettingsScreen }    from '../screens/SettingsScreen';
import { HiddenTitlesScreen } from '../screens/HiddenTitlesScreen';
import { Theme }             from '../components/BurgundhyTheme';
import { useSafeFeed }       from '../hooks/useSafeFeed';
import type { ContentTitle } from '@streambrws/shared-types';
import { profileApi }        from '@streambrws/shared-logic';
import { useExclusionStore } from '../store';

type AuthTab = 'login' | 'register';
type MainTab = 'home' | 'search' | 'hidden' | 'settings';

const { height: H } = Dimensions.get('window');

export function AppNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [mainTab, setMainTab] = useState<MainTab>('home');

  // PIN unlock modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const { verifyPin } = useSafeFeed();

  // Title context menu
  const [contextTitle, setContextTitle] = useState<ContentTitle | null>(null);
  const { hideTitle } = useExclusionStore();

  const handleTitleLongPress = (title: ContentTitle) => setContextTitle(title);

  const handleHideTitle = async () => {
    if (!contextTitle) return;
    hideTitle(contextTitle.id);
    await profileApi.hideTitle(contextTitle.id, contextTitle.serviceId, contextTitle.title);
    setContextTitle(null);
  };

  const handleUnlockSafeFeed = () => { setPinValue(''); setPinModalVisible(true); };

  if (!isAuthenticated) {
    return authTab === 'login'
      ? <LoginScreen onNavigateRegister={() => setAuthTab('register')} />
      : <RegisterScreen onNavigateLogin={() => setAuthTab('login')} />;
  }

  const renderScreen = () => {
    switch (mainTab) {
      case 'home':    return <HomeScreen onTitlePress={() => {}} onTitleLongPress={handleTitleLongPress} onUnlockSafeFeed={handleUnlockSafeFeed} />;
      case 'search':  return <SearchScreen onTitlePress={() => {}} onTitleLongPress={handleTitleLongPress} />;
      case 'hidden':  return <HiddenTitlesScreen />;
      case 'settings':return <SettingsScreen />;
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      {/* Screen area */}
      <View style={styles.screenArea}>{renderScreen()}</View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {([ ['home','🏠','Browse'], ['search','🔍','Search'], ['hidden','👁️','Hidden'], ['settings','⚙️','Settings'] ] as [MainTab, string, string][]).map(([id, icon, label]) => (
          <TouchableOpacity key={id} style={styles.tab} onPress={() => setMainTab(id)}>
            <Text style={[styles.tabIcon, mainTab === id && styles.tabActive]}>{icon}</Text>
            <Text style={[styles.tabLabel, mainTab === id && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title context menu */}
      <Modal visible={!!contextTitle} transparent animationType="slide" onRequestClose={() => setContextTitle(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{contextTitle?.title}</Text>
            <Text style={styles.sheetMeta}>{contextTitle?.year} · {contextTitle?.serviceId?.replace('_', ' ')}</Text>
            <TouchableOpacity style={styles.sheetAction} onPress={handleHideTitle}>
              <Text style={styles.sheetActionText}>👁️  Hide from feed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetAction, styles.sheetDismiss]} onPress={() => setContextTitle(null)}>
              <Text style={styles.sheetDismissText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN unlock modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.pinOverlay}>
          <View style={styles.pinCard}>
            <Text style={styles.pinCardTitle}>🔒 Unlock Safe-Feed</Text>
            <Text style={styles.pinCardSub}>Enter your PIN to temporarily unlock Safe-Feed mode</Text>
            <View style={styles.pinDots}>
              {[0,1,2,3].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: i < pinValue.length ? Theme.colors.gold : Theme.bg.card }]} />
              ))}
            </View>
            {/* Numpad */}
            {[[1,2,3],[4,5,6],[7,8,9],['',0,'⌫']].map((row, ri) => (
              <View key={ri} style={styles.numRow}>
                {row.map((k, ki) => (
                  <TouchableOpacity
                    key={ki}
                    style={styles.numKey}
                    onPress={() => {
                      if (k === '⌫') setPinValue(v => v.slice(0, -1));
                      else if (k !== '') setPinValue(v => v.length < 8 ? v + String(k) : v);
                    }}
                  >
                    <Text style={styles.numKeyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <TouchableOpacity style={styles.pinSubmit} onPress={async () => {
              const ok = await verifyPin(pinValue);
              if (ok) { setPinModalVisible(false); setPinValue(''); }
              else { Alert.alert('Incorrect PIN', 'Please try again.'); setPinValue(''); }
            }}>
              <Text style={styles.pinSubmitText}>Unlock</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPinModalVisible(false); setPinValue(''); }}>
              <Text style={styles.pinCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Theme.bg.screen },
  screenArea:  { flex: 1 },
  tabBar: {
    flexDirection: 'row', backgroundColor: Theme.bg.card,
    borderTopWidth: 1, borderTopColor: Theme.border.default,
    paddingBottom: 20, paddingTop: Theme.spacing.sm,
  },
  tab:          { flex: 1, alignItems: 'center' },
  tabIcon:      { fontSize: 22, color: Theme.text.muted },
  tabActive:    { color: Theme.colors.gold },
  tabLabel:     { fontSize: 10, color: Theme.text.muted, marginTop: 2 },
  tabLabelActive: { color: Theme.colors.gold, fontWeight: Theme.typography.weight.semiBold },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Theme.bg.card, borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl, padding: Theme.spacing.xl, paddingBottom: 40,
  },
  sheetTitle:   { color: Theme.text.primary, fontSize: Theme.typography.lg, fontWeight: Theme.typography.weight.bold },
  sheetMeta:    { color: Theme.text.muted, fontSize: Theme.typography.sm, marginBottom: Theme.spacing.lg, textTransform: 'capitalize' },
  sheetAction:  {
    backgroundColor: Theme.bg.surface, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, marginBottom: Theme.spacing.sm,
  },
  sheetActionText: { color: Theme.text.primary, fontSize: Theme.typography.md },
  sheetDismiss: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Theme.border.default },
  sheetDismissText: { color: Theme.text.muted, fontSize: Theme.typography.md, textAlign: 'center' },
  pinOverlay:   { flex: 1, backgroundColor: Theme.colors.scrim, justifyContent: 'center', alignItems: 'center' },
  pinCard: {
    backgroundColor: Theme.bg.card, borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl, width: '88%', alignItems: 'center',
    borderWidth: 1, borderColor: Theme.border.default,
  },
  pinCardTitle: { color: Theme.text.primary, fontSize: Theme.typography.xl, fontWeight: Theme.typography.weight.bold, marginBottom: Theme.spacing.xs },
  pinCardSub:   { color: Theme.text.muted, fontSize: Theme.typography.sm, textAlign: 'center', marginBottom: Theme.spacing.lg },
  pinDots:      { flexDirection: 'row', gap: 12, marginBottom: Theme.spacing.xl },
  dot:          { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: Theme.border.default },
  numRow:       { flexDirection: 'row', marginBottom: Theme.spacing.sm },
  numKey: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.bg.surface, margin: 6,
  },
  numKeyText: { color: Theme.text.primary, fontSize: Theme.typography.xl, fontWeight: Theme.typography.weight.medium },
  pinSubmit: {
    backgroundColor: Theme.colors.burgundy500, borderRadius: Theme.radius.full,
    paddingVertical: Theme.spacing.md, paddingHorizontal: Theme.spacing.xxxl, marginTop: Theme.spacing.md,
  },
  pinSubmitText: { color: Theme.colors.white, fontSize: Theme.typography.md, fontWeight: Theme.typography.weight.bold },
  pinCancel: { color: Theme.text.muted, marginTop: Theme.spacing.md, fontSize: Theme.typography.sm },
});
