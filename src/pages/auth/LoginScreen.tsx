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
  lime: '#EDF7BD',
  card: '#FFFFFF',
  inputBg: '#F0EFE9',
  inputBorder: '#E2E0D8',
  inputBorderFocus: '#4E8D9C',
  placeholder: '#ABA89F',
  textMuted: '#8A8780',
};

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { setAuthFromLogin } = AuthStore();
  const { showToast } = ToastStateStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    formOpacity.value = withDelay(320, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    formY.value = withDelay(320, withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }));
    footerOpacity.value = withDelay(580, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
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

  const onLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setAuthFromLogin(response.data);
      showToast({ message: 'Welcome back to rydnex.', type: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Login failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4EE" />

      {/* Decorative geometry */}
      <Animated.View style={[StyleSheet.absoluteFill, decoStyle]} pointerEvents="none">
        {/* Large ring — top right, partially clipped */}
        <View style={styles.ringTR} />
        {/* Small filled circle — bottom left */}
        <View style={styles.dotBL} />
        {/* Accent bar — horizontal rule behind form area */}
        <View style={styles.accentBarBR} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Brand */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.iconBadge}>
            <MaterialIcons name="speed" size={26} color="#FFFFFF" />
          </View>
          {/* Accent line above wordmark */}
          <View style={styles.accentLine} />
          <Text style={styles.wordmark}>rydnex</Text>
          <Text style={styles.tagline}>Vehicle intelligence, crafted for drivers who care.</Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View style={[styles.card, formStyle]}>
          <Text style={styles.cardTitle}>Sign in</Text>

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

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            </View>
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
                placeholder="Enter password"
                placeholderTextColor={C.placeholder}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
            {!loading && <MaterialIcons name="arrow-forward" size={17} color="#EDF7BD" />}
          </Pressable>
        </Animated.View>

        {/* Register footer */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Create one</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EE',
  },

  // Decorative shapes
  ringTR: {
    position: 'absolute',
    top: -110,
    right: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 28,
    borderColor: '#281C59',
    opacity: 0.06,
    backgroundColor: 'transparent',
  },
  dotBL: {
    position: 'absolute',
    bottom: 48,
    left: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#85C79A',
    opacity: 0.22,
  },
  accentBarBR: {
    position: 'absolute',
    bottom: 140,
    right: 24,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4E8D9C',
    opacity: 0.35,
  },

  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 18,
  },

  // Brand header
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#281C59',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#281C59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
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
  wordmark: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 50,
    color: '#281C59',
    letterSpacing: 2,
    lineHeight: 56,
  },
  tagline: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 12,
    color: '#4E8D9C',
    letterSpacing: 0.3,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 230,
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
  cardTitle: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 21,
    color: '#281C59',
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  // Fields
  field: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 10,
    color: '#281C59',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  forgotLink: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 11,
    color: '#4E8D9C',
    letterSpacing: 0.2,
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
