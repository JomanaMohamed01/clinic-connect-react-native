import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, Heart, Stethoscope } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BootScreen } from "@/components/BootScreen";
import { GradientButton } from "@/components/GradientButton";
import { colors, fonts, shadow } from "@/constants/theme";
import { RECEPTION_PASSWORD, isReceptionEmail } from "@/lib/api";
import {
  EMPTY_FIELD_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  PASSWORD_REQUIREMENTS_MESSAGE,
  getPasswordStrength,
  isAllowedSignupEmail,
  meetsPasswordCharacterRules,
  type PasswordStrength,
} from "@/lib/validation";
import { useClinic } from "@/providers/ClinicProvider";

type Mode = "signin" | "signup";
type FieldErrors = {
  name?: boolean;
  email?: "empty" | "invalid";
  password?: "empty" | "requirements";
};

const strengthLabel: Record<PasswordStrength, string> = {
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
};

const strengthColor: Record<PasswordStrength, string> = {
  weak: colors.danger,
  medium: colors.amber,
  strong: colors.success,
};

const strengthWidth: Record<PasswordStrength, `${number}%`> = {
  weak: "33%",
  medium: "66%",
  strong: "100%",
};

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, user, isReception, configured, signIn, signUp, showToast } = useClinic();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const passwordStrength = getPasswordStrength(password);

  if (!ready) return <BootScreen />;
  if (user) return <Redirect href={isReception ? "/reception" : "/doctors"} />;

  function clearField(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit() {
    const nextErrors: FieldErrors = {};
    if (mode === "signup" && !name.trim()) nextErrors.name = true;
    if (!email.trim()) nextErrors.email = "empty";
    else if (mode === "signup" && !isAllowedSignupEmail(email)) nextErrors.email = "invalid";
    if (!password) nextErrors.password = "empty";
    else if (mode === "signup" && !meetsPasswordCharacterRules(password)) {
      nextErrors.password = "requirements";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      if (mode === "signup") {
        if (isReceptionEmail(trimmedEmail)) {
          throw new Error("Reception staff should sign in, not create an account.");
        }
        if (passwordStrength !== "strong") {
          throw new Error("Password must be strong.");
        }
        await signUp(name.trim(), trimmedEmail, password);
        showToast(`Welcome, ${name.trim().split(" ")[0]}!`);
        router.replace("/doctors");
        return;
      }

      if (isReceptionEmail(trimmedEmail) && password !== RECEPTION_PASSWORD) {
        throw new Error("Invalid email or password.");
      }
      const destination = await signIn(trimmedEmail, password);
      if (destination === "reception") {
        showToast("Welcome, reception desk.");
        router.replace("/reception");
        return;
      }
      showToast("Welcome back!");
      router.replace("/doctors");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={["#F8EFE6", "#F6E4D8", "#E7F0E8"]} style={styles.root}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <LinearGradient colors={["#E59A7A", "#D47262"]} style={styles.logo}>
              <Stethoscope color={colors.primaryInk} size={32} />
            </LinearGradient>
            <Text style={styles.heroTitle}>Bloom Clinic</Text>
            <View style={styles.tagline}>
              <Heart color={colors.primary} size={16} />
              <Text style={styles.taglineText}>Care that feels like home</Text>
            </View>
          </View>

          <View style={[styles.card, shadow]}>
            <View style={styles.tabs}>
              {(["signin", "signup"] as const).map((value) => {
                const active = mode === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setMode(value);
                      setFieldErrors({});
                    }}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {value === "signin" ? "Sign in" : "Sign up"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!configured ? (
              <Text style={styles.configNote}>
                Add the clinic-connect Supabase URL and anon key to .env before signing in. Both apps will share the same accounts and appointments.
              </Text>
            ) : null}

            {mode === "signup" ? (
              <Field
                label="Full name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  clearField("name");
                }}
                placeholder="Sara Ahmed"
                error={fieldErrors.name ? EMPTY_FIELD_MESSAGE : undefined}
              />
            ) : null}

            <Field
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearField("email");
              }}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={
                fieldErrors.email
                  ? fieldErrors.email === "invalid"
                    ? INVALID_EMAIL_MESSAGE
                    : EMPTY_FIELD_MESSAGE
                  : undefined
              }
            />

            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordWrap, fieldErrors.password && styles.inputError]}>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearField("password");
                }}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={styles.passwordInput}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eye}>
                {showPassword ? (
                  <EyeOff color={colors.muted} size={18} />
                ) : (
                  <Eye color={colors.muted} size={18} />
                )}
              </Pressable>
            </View>
            {fieldErrors.password === "empty" ? (
              <Text style={styles.error}>{EMPTY_FIELD_MESSAGE}</Text>
            ) : null}
            {mode === "signup" ? (
              <Text style={[styles.hint, fieldErrors.password === "requirements" && styles.error]}>
                {PASSWORD_REQUIREMENTS_MESSAGE}
              </Text>
            ) : null}
            {mode === "signup" && passwordStrength ? (
              <View style={styles.strength}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: strengthWidth[passwordStrength],
                        backgroundColor: strengthColor[passwordStrength],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor[passwordStrength] }]}>
                  Password strength: {strengthLabel[passwordStrength]}
                </Text>
                {passwordStrength !== "strong" ? (
                  <Text style={styles.hint}>
                    Use 8+ characters with upper & lowercase, a number, and a symbol.
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <GradientButton
                label={mode === "signin" ? "Sign in" : "Create account"}
                onPress={() => void onSubmit()}
                loading={submitting}
              />
            </View>
            <Text style={styles.footer}>Your appointments are saved securely to your clinic account.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blobTop: {
    position: "absolute",
    top: -80,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(224, 139, 120, 0.28)",
  },
  blobBottom: {
    position: "absolute",
    bottom: -90,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(143, 203, 170, 0.35)",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  hero: {
    alignItems: "center",
    marginBottom: 22,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    color: colors.ink,
  },
  tagline: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taglineText: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(234, 223, 214, 0.9)",
    padding: 18,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3EBE4",
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    color: colors.muted,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.ink,
  },
  configNote: {
    marginBottom: 12,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  passwordWrap: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 15,
  },
  eye: {
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
  },
  error: {
    marginTop: 4,
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 12,
  },
  hint: {
    marginTop: 4,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  strength: {
    marginTop: 8,
    gap: 4,
  },
  strengthTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F3EBE4",
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 999,
  },
  strengthLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  footer: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 12,
  },
});
