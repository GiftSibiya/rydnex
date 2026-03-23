import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenScaffold from '@/shared/ui/ScreenScaffold';
import { useAppTheme } from '@/themes/AppTheme';
import { FONT_FAMILY } from '@/constants/Fonts';
import { authService } from '@/backend';
import { AuthStore, ToastStateStore } from '@/stores/StoresIndex';

const RegistrationScreen = () => {
  const { colors } = useAppTheme();
  const { setAuthFromRegistration } = AuthStore();
  const { showToast } = ToastStateStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    try {
      const response = await authService.register({ name, email, password });
      setAuthFromRegistration(response.data);
      showToast({ message: 'Account created successfully.', type: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Registration failed.', type: 'error' });
    }
  };

  return (
    <ScreenScaffold title="Create Account" subtitle="Start your premium vehicle logbook.">
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Create password"
          placeholderTextColor={colors.textMuted}
        />
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onRegister}>
          <Text style={styles.buttonText}>Create account</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 18, padding: 16 },
  label: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: FONT_FAMILY.poppinsRegular },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    fontFamily: FONT_FAMILY.poppinsRegular,
  },
  button: { borderRadius: 12, paddingVertical: 12, marginTop: 6 },
  buttonText: { color: '#FFF', textAlign: 'center', fontFamily: FONT_FAMILY.nexaBold, letterSpacing: 0.3 },
});

export default RegistrationScreen;
