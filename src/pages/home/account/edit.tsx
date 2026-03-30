import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../src/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = Colors.dark;

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
  secure?: boolean;
  autoCapitalize?: "none" | "words";
  hint?: string;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", secure, autoCapitalize, hint }: FieldProps) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textSubtle}
          keyboardType={keyboardType}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setHidden(h => !h)}>
            <Feather name={hidden ? "eye" : "eye-off"} size={16} color={C.textSubtle} />
          </TouchableOpacity>
        )}
      </View>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export default function EditAccountScreen() {
  const { userEmail, userName, updateAccount } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(userName ?? "");
  const [email, setEmail] = useState(userEmail ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(userName ?? "");
    setEmail(userEmail ?? "");
  }, [userName, userEmail]);

  const handleSave = async () => {
    setError(null);

    if (!email.trim()) { setError("Email is required"); return; }
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    if (newPassword.length > 0 && newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }

    setSaving(true);
    const result = await updateAccount({
      name: name.trim() || undefined,
      email: email.trim(),
      password: newPassword.length > 0 ? newPassword : undefined,
    });
    setSaving(false);

    if (result.success) {
      Alert.alert("Saved", "Your account has been updated.", [{ text: "OK", onPress: () => router.back() }]);
    } else {
      setError(result.error ?? "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Feather name="user" size={36} color={C.tint} />
          </View>
          <Text style={styles.avatarHint}>Account details are stored on this device only</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Identity</Text>
          <View style={styles.card}>
            <Field
              label="Display Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
            />
            <View style={styles.fieldDivider} />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Change Password</Text>
          <View style={styles.card}>
            <Field
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current"
              secure
              hint="Minimum 6 characters"
            />
            {newPassword.length > 0 && (
              <>
                <View style={styles.fieldDivider} />
                <Field
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat new password"
                  secure
                />
              </>
            )}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, gap: 24 },

  avatarWrap: { alignItems: "center", gap: 10, paddingVertical: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(46,204,113,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(46,204,113,0.3)",
  },
  avatarHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSubtle, textAlign: "center" },

  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    overflow: "hidden",
  },

  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSubtle, letterSpacing: 0.5, textTransform: "uppercase" },
  inputWrap: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: C.text,
    paddingVertical: 0,
  },
  eyeBtn: { paddingLeft: 8 },
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSubtle },
  fieldDivider: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(231,76,60,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.2)",
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: C.danger },

  saveBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
