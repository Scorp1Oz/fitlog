import { BlurView } from "expo-blur";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";

import { useLock } from "@/lock/LockContext";
import { useTheme } from "@/theme/useTheme";

import { useAuth } from "./AuthContext";
import { FloatingCrosses } from "./FloatingCrosses";

type Mode = "login" | "register";

export function AuthScreen() {
  const { login, register } = useAuth();
  const { setEnabled, biometricsAvailable } = useLock();
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [login_, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [stay, setStay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Розмір екрана — щоб задати радіальний градієнт у пікселях (ідеальне коло).
  const [size, setSize] = useState({ width: 0, height: 0 });

  const isRegister = mode === "register";

  // Одноразово після реєстрації пропонуємо ввімкнути біометрію
  // (лише якщо пристрій її підтримує). Змінити можна потім у налаштуваннях.
  const askBiometrics = () => {
    Alert.alert(
      "Біометрія",
      "Використовувати біометрію для входу в додаток?",
      [
        { text: "Ні", style: "cancel", onPress: () => void setEnabled(false) },
        { text: "Так", onPress: () => void setEnabled(true) },
      ]
    );
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = isRegister
      ? await register(login_, password, stay)
      : await login(login_, password, stay);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (isRegister && biometricsAvailable) {
      askBiometrics();
    }
    // Успіх — AuthGate сам перемкне на додаток.
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError(null);
  };

  return (
    <View
      className="flex-1 bg-bg"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {/* Радіальне лаймове світіння з лівого-верхнього кута, що тоне в темний.
          userSpaceOnUse + піксельні cx/cy/r → коло не розтягується (ідеально радіальне). */}
      {size.width > 0 ? (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="limeGlow"
              gradientUnits="userSpaceOnUse"
              cx={size.width * 0.5}
              cy={-size.height * 0.08}
              r={size.width * 0.95}
            >
              <Stop offset="0" stopColor={colors.lime} stopOpacity={0.7} />
              <Stop offset="0.45" stopColor={colors.lime} stopOpacity={0.14} />
              <Stop offset="1" stopColor={colors.bg} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#limeGlow)" />
        </Svg>
      ) : null}
      {/* Розмите скло — окремий шар МІЖ градієнтом і хрестиками: згладжує
          «кільця» градієнта, але хрестики лишаються чіткими (вони вище). */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Сірі хрестики, що повільно літають — НАД склом, тож не розмиваються. */}
      {size.width > 0 ? (
        <FloatingCrosses width={size.width} height={size.height} />
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center gap-7 px-6">
        {/* Бренд по центру */}
        <View className="items-center gap-1">
          <Text className="font-display text-6xl text-lime">FITLOG</Text>
          <Text className="font-display text-2xl text-text">
            {isRegister ? "РЕЄСТРАЦІЯ" : "ВХІД"}
          </Text>
        </View>

        {/* Поля з підписами над ними */}
        <View className="gap-4">
          <View className="gap-2">
            <Text className="font-mono text-[10px] tracking-[2px] text-text">
              ЛОГІН АБО EMAIL
            </Text>
            <TextInput
              value={login_}
              onChangeText={setLogin}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-md border border-border bg-surface px-3 py-3 font-sans text-text"
            />
          </View>

          <View className="gap-2">
            <Text className="font-mono text-[10px] tracking-[2px] text-text">
              ПАРОЛЬ
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              className="rounded-md border border-border bg-surface px-3 py-3 font-sans text-text"
            />
          </View>

          {/* Залишитись у системі */}
          <View className="flex-row items-center justify-between">
            <Text className="font-sans text-sm text-text">
              Залишитись у системі
            </Text>
            <Switch
              value={stay}
              onValueChange={setStay}
              trackColor={{ false: colors.faint, true: colors.limeTrack }}
              thumbColor={stay ? colors.lime : colors.text}
              ios_backgroundColor={colors.faint}
            />
          </View>
        </View>

        {error ? (
          <Text className="font-mono text-xs text-orange">{error}</Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          className="items-center rounded-md bg-lime py-3 active:opacity-80"
        >
          <Text className="font-sans-strong text-base text-on-lime">
            {isRegister ? "СТВОРИТИ АКАУНТ" : "УВІЙТИ"}
          </Text>
        </Pressable>

        <Pressable onPress={switchMode} className="items-center py-1">
          <Text className="font-sans text-sm text-text">
            {isRegister
              ? "Уже маєш акаунт? Увійти"
              : "Немає акаунта? Зареєструватись"}
          </Text>
        </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
