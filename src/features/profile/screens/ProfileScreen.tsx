import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import { AuthStore, ToastStateStore } from '@/stores/StoresIndex';
import { useAppTheme } from '@/themes/AppTheme';

const ProfileScreen = () => {
  const { colors } = useAppTheme();
  const { logout, user } = AuthStore();
  const { showToast } = ToastStateStore();

  return (
    <ScreenScaffold title="Profile" subtitle="Account, subscriptions, and partner services">
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{user?.name ?? 'Driver'}</Text>
        <Text style={{ color: colors.textMuted }}>{user?.email ?? 'No email on session'}</Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Subscription</Text>
        <Text style={{ color: colors.textMuted }}>Free tier: 2 vehicles. Pro unlocks unlimited vehicles + document uploads.</Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Coming Soon</Text>
        <Text style={{ color: colors.textMuted }}>Insurance integration</Text>
        <Text style={{ color: colors.textMuted }}>Find mechanic (partner network)</Text>
      </View>
      <Pressable
        style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
        onPress={async () => {
          await logout();
          showToast({ message: 'Signed out.', type: 'info' });
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Sign out</Text>
      </Pressable>
    </ScreenScaffold>
  );
};

export default ProfileScreen;
