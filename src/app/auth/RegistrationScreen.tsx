import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '@/constants/Fonts';
import { authService } from '@/backend';
import { AuthStore, ToastStateStore } from '@/stores/StoresIndex';

const C = {
  bg: '#F5F4EE',
  ink: '#281C59',
  teal: '#4E8D9C',
  green: '#85C79A',
  card: '#FFFFFF',
  inputBg: '#F0EFE9',
  inputBorder: '#E2E0D8',
  placeholder: '#ABA89F',
  textMuted: '#8A8780',
};

const RegistrationScreen = () => {
  const navigation = useNavigation<any>();
  const { showToast } = ToastStateStore();
  const { setAuthFromRegistration } = AuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const decoOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(28);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    decoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    headerOpacity.value = withDelay(160, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    headerY.value = withDelay(160, withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    formY.value = withDelay(300, withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }));
    footerOpacity.value = withDelay(560, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, []);

  const decoStyle = useAnimatedStyle(() => ({ opacity: decoOpacity.value }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));

  const onContinue = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast({ message: 'Please fill in all fields.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (!response.success) {
        showToast({ message: response.message ?? response.error ?? 'Registration failed.', type: 'error' });
        return;
      }

      if (response.data) {
        setAuthFromRegistration(response.data);
        showToast({ message: response.message ?? 'Account created successfully.', type: 'success' });
        return;
      }

      if (response.requiresOtp && response.userId) {
        navigation.navigate('RegistrationOtp', { userId: response.userId, email: response.email ?? email.trim() });
        return;
      }

      showToast({
        message: response.message ?? 'Verification setup failed. Please try registering again.',
        type: 'error',
      });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Registration failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4EE" />

      {/* Decorative geometry — mirrored from login for visual continuity */}
      <Animated.View style={[StyleSheet.absoluteFill, decoStyle]} pointerEvents="none">
        <View style={styles.ringBL} />
        <View style={styles.dotTR} />
        <View style={styles.accentBarTL} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.stepRow}>
            <View style={styles.stepPill}>
              <Text style={styles.stepText}>Step 1 of 2</Text>
            </View>
          </View>
          <View style={styles.iconBadge}>
            <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.accentLine} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your premium vehicle logbook.</Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View style={[styles.card, formStyle]}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputRow, nameFocused && styles.inputRowFocused]}>
              <MaterialIcons
                name="person-outline"
                size={15}
                color={nameFocused ? C.teal : C.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={C.placeholder}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <MaterialIcons
                name="mail-outline"
                size={15}
                color={emailFocused ? C.teal : C.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.placeholder}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, passwordFocused && styles.inputRowFocused]}>
              <MaterialIcons
                name="lock-outline"
                size={15}
                color={passwordFocused ? C.teal : C.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={C.placeholder}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Continue'}</Text>
            {!loading && <MaterialIcons name="arrow-forward" size={17} color="#EDF7BD" />}
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegistrationScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EE',
  },

  // Decorative shapes — inverted positions from LoginScreen
  ringBL: {
    position: 'absolute',
    bottom: -110,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 28,
    borderColor: '#4E8D9C',
    opacity: 0.08,
    backgroundColor: 'transparent',
  },
  dotTR: {
    position: 'absolute',
    top: 32,
    right: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDF7BD',
    opacity: 0.7,
  },
  accentBarTL: {
    position: 'absolute',
    top: 160,
    left: 24,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#85C79A',
    opacity: 0.4,
  },

  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 18,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  stepRow: {
    marginBottom: 14,
  },
  stepPill: {
    backgroundColor: '#EDF7BD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stepText: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 10,
    color: '#281C59',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4E8D9C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4E8D9C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#85C79A',
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 36,
    color: '#281C59',
    letterSpacing: 0.8,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 12,
    color: '#4E8D9C',
    letterSpacing: 0.3,
    marginTop: 8,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#281C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  // Fields
  field: { gap: 6 },
  label: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 10,
    color: '#281C59',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFE9',
    borderWidth: 1.5,
    borderColor: '#E2E0D8',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputRowFocused: {
    borderColor: '#4E8D9C',
    backgroundColor: 'rgba(78,141,156,0.05)',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 14,
    color: '#281C59',
  },

  // Button
  button: {
    backgroundColor: '#281C59',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    shadowColor: '#281C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPressed: { opacity: 0.84 },
  buttonText: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 15,
    color: '#EDF7BD',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 13,
    color: '#8A8780',
  },
  footerLink: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 13,
    color: '#85C79A',
    letterSpacing: 0.2,
  },
});
