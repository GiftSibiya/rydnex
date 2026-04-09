import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '@/constants/Fonts';
import { authService } from '@/backend';
import { AuthStore, ToastStateStore } from '@/stores/StoresIndex';

type RouteParams = {
  userId: number;
  email: string;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const RegistrationOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { userId, email } = route.params as RouteParams;

  const { setAuthFromRegistration } = AuthStore();
  const { showToast } = ToastStateStore();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Entrance animations
  const decoOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const boxesOpacity = useSharedValue(0);
  const boxesY = useSharedValue(24);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    decoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    headerOpacity.value = withDelay(160, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    headerY.value = withDelay(160, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    boxesOpacity.value = withDelay(300, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    boxesY.value = withDelay(300, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    actionsOpacity.value = withDelay(480, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));

    // Auto-focus first box after entrance
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const decoStyle = useAnimatedStyle(() => ({ opacity: decoOpacity.value }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const boxesStyle = useAnimatedStyle(() => ({
    opacity: boxesOpacity.value,
    transform: [{ translateY: boxesY.value }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actionsOpacity.value }));

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onVerify = async () => {
    if (!userId) {
      showToast({ message: 'Missing verification context. Please register again.', type: 'error' });
      return;
    }
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      showToast({ message: 'Please enter the full 6-digit code.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const result = await authService.verifyRegistrationOtp(userId, code);
      if (!result.success) {
        showToast({ message: result.message ?? result.error ?? 'Verification failed.', type: 'error' });
        return;
      }
      setAuthFromRegistration(result.data);
      showToast({ message: 'Account verified. Welcome to rydnex!', type: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message ?? 'Verification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!userId) {
      showToast({ message: 'Unable to resend code. Please register again.', type: 'error' });
      return;
    }
    if (countdown > 0) return;
    setLoading(true);
    try {
      const result = await authService.resendRegistrationOtp(userId);
      if (!result.success) {
        showToast({ message: result.message ?? result.error ?? 'Failed to resend code.', type: 'error' });
        return;
      }
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      showToast({ message: result.message ?? 'A new code has been sent.', type: 'success' });
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, _b, c) => `${a}••••${c}`)
    : '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4EE" />

      {/* Decorative geometry */}
      <Animated.View style={[StyleSheet.absoluteFill, decoStyle]} pointerEvents="none">
        <View style={styles.ringTR} />
        <View style={styles.dotBL} />
        <View style={styles.accentBar} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#281C59" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.stepRow}>
            <View style={styles.stepPill}>
              <Text style={styles.stepText}>Step 2 of 2</Text>
            </View>
          </View>
          <View style={styles.iconBadge}>
            <MaterialIcons name="mark-email-read" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.accentLine} />
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>
          </Text>
        </Animated.View>

        {/* OTP Boxes */}
        <Animated.View style={[styles.boxesRow, boxesStyle]}>
          {digits.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.box,
                focusedIndex === i && styles.boxFocused,
                digit !== '' && styles.boxFilled,
              ]}
            >
              <TextInput
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={digit}
                onChangeText={(v) => handleDigitChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.boxInput, digit !== '' && styles.boxInputFilled]}
                selectionColor="#4E8D9C"
              />
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, actionsStyle]}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Verifying…' : 'Verify Email'}</Text>
            {!loading && <MaterialIcons name="check" size={17} color="#EDF7BD" />}
          </Pressable>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it? </Text>
            <Pressable onPress={onResend} disabled={countdown > 0}>
              <Text style={[styles.resendLink, countdown > 0 && styles.resendLinkDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegistrationOtpScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EE',
  },

  // Decorative
  ringTR: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 24,
    borderColor: '#85C79A',
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  dotBL: {
    position: 'absolute',
    bottom: 60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4E8D9C',
    opacity: 0.1,
  },
  accentBar: {
    position: 'absolute',
    bottom: 180,
    right: 24,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#281C59',
    opacity: 0.12,
  },

  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
  },

  // Back
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 13,
    color: '#281C59',
    opacity: 0.6,
  },

  // Header
  header: {
    alignItems: 'center',
  },
  stepRow: { marginBottom: 14 },
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
    backgroundColor: '#85C79A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#85C79A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4E8D9C',
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
    fontSize: 13,
    color: '#8A8780',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: '#4E8D9C',
    fontFamily: FONT_FAMILY.nexaBold,
  },

  // OTP boxes
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#281C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  boxFocused: {
    borderColor: '#4E8D9C',
    backgroundColor: 'rgba(78,141,156,0.05)',
  },
  boxFilled: {
    borderColor: '#85C79A',
    backgroundColor: 'rgba(133,199,154,0.06)',
  },
  boxInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 22,
    color: '#281C59',
  },
  boxInputFilled: {
    color: '#281C59',
  },

  // Actions
  actions: { gap: 16 },
  button: {
    backgroundColor: '#281C59',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 13,
    color: '#8A8780',
  },
  resendLink: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 13,
    color: '#4E8D9C',
    letterSpacing: 0.2,
  },
  resendLinkDisabled: {
    color: '#ABA89F',
  },
});
