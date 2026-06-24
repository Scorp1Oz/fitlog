import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, TextInput, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { LimeGlow } from "@/components/LimeGlow";
import { StackHeader } from "@/components/StackHeader";
import { ageFromBirthdate } from "@/lib/date";
import { Avatar } from "@/profile/Avatar";
import { useTheme } from "@/theme/useTheme";

// ISO 'YYYY-MM-DD' → відображення 'ДД.ММ.РРРР' (порожнє, якщо нема дати).
function isoToDisplay(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
}

// Маска вводу: лишаємо лише цифри (макс. 8) і розставляємо крапки ДД.ММ.РРРР.
function maskBirthdate(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (digits.length >= 2) out += "." + mm;
  if (digits.length >= 4) out += "." + yyyy;
  return out;
}

// Українське відмінювання «рік/роки/років» за числом.
function pluralYears(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "РІК";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "РОКИ";
  return "РОКІВ";
}

// 'ДД.ММ.РРРР' → ISO 'YYYY-MM-DD'. null, якщо неповна/некоректна дата.
function displayToIso(display: string): string | null {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const d = Number(digits.slice(0, 2));
  const m = Number(digits.slice(2, 4));
  const y = Number(digits.slice(4, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m - 1, d);
  // Відсіює неіснуючі дати (напр. 31.02): JS «переповнить» місяць.
  if (date.getDate() !== d || date.getMonth() !== m - 1) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [name, setName] = useState(profile?.display_name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    profile?.avatar_uri ?? null
  );
  const [birthInput, setBirthInput] = useState(
    isoToDisplay(profile?.birthdate ?? null)
  );
  const [busy, setBusy] = useState(false);

  const previewName = name.trim() || profile?.username || "";
  const birthIso = displayToIso(birthInput);
  const age = ageFromBirthdate(birthIso);
  // Введено щось, але дата ще неповна/некоректна — підсвічуємо підказку.
  const birthInvalid = birthInput.length > 0 && birthIso === null;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Доступ", "Дозвольте доступ до фото, щоб обрати аватар.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked = result.assets[0].uri;

    // Веб не має documentDirectory — лишаємо URI як є.
    if (Platform.OS === "web") {
      setAvatarUri(picked);
      return;
    }

    // На пристрої копіюємо фото в постійне сховище додатка, у БД пишемо лише URI.
    try {
      const ext = picked.split("?")[0].split(".").pop() || "jpg";
      const dest = new File(Paths.document, `avatar_${Date.now()}.${ext}`);
      await new File(picked).copy(dest);
      setAvatarUri(dest.uri);
    } catch {
      setAvatarUri(picked); // запасний варіант — тимчасовий URI
    }
  };

  const save = async () => {
    setBusy(true);
    // Порожнє поле → скидаємо дату (null); некоректний ввід не зберігаємо.
    const birthdate = birthInput.trim().length === 0 ? null : birthIso;
    await updateProfile({
      displayName: name.trim() || null,
      avatarUri,
      ...(birthInput.trim().length === 0 || birthIso ? { birthdate } : {}),
    });
    setBusy(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <StackHeader title="ПРОФІЛЬ" />

      <View className="items-center gap-6 px-4 pt-8">
        <Pressable
          onPress={pickPhoto}
          className="items-center gap-2 active:opacity-80"
        >
          <Avatar uri={avatarUri} name={previewName} size={96} />
          <Text className="font-mono text-[10px] tracking-[1px] text-lime">
            ЗМІНИТИ ФОТО
          </Text>
        </Pressable>

        {/* Видалити аватар — лише коли він є. */}
        {avatarUri ? (
          <Pressable onPress={() => setAvatarUri(null)} hitSlop={8}>
            <Text className="font-mono text-[10px] tracking-[1px] text-orange">
              ВИДАЛИТИ ФОТО
            </Text>
          </Pressable>
        ) : null}

        <View className="w-full gap-2">
          <Text className="font-mono text-[10px] tracking-[2px] text-text">
            ІМ'Я
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={profile?.username}
            placeholderTextColor={colors.textDim}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
          <Text className="font-mono text-[10px] text-text-dim">
            @{profile?.username} · логін незмінний
          </Text>
        </View>

        <View className="w-full gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[10px] tracking-[2px] text-text">
              ДАТА НАРОДЖЕННЯ
            </Text>
            {age !== null ? (
              <Text className="font-mono text-[10px] tracking-[1px] text-lime">
                {age} {pluralYears(age)}
              </Text>
            ) : null}
          </View>
          <TextInput
            value={birthInput}
            onChangeText={(t) => setBirthInput(maskBirthdate(t))}
            placeholder="ДД.ММ.РРРР"
            placeholderTextColor={colors.textDim}
            keyboardType="number-pad"
            maxLength={10}
            className="rounded-md border-b border-border bg-surface px-3 py-3 font-sans text-text"
          />
          <Text
            className={`font-mono text-[10px] ${
              birthInvalid ? "text-orange" : "text-text-dim"
            }`}
          >
            {birthInvalid
              ? "Введи дату у форматі ДД.ММ.РРРР"
              : "Напр. 21.05.1998"}
          </Text>
        </View>

        <LimeGlow className="w-full" radius={6}>
          <Pressable
            onPress={save}
            disabled={busy}
            className="w-full items-center rounded-md bg-lime py-3 active:opacity-80"
          >
            <Text className="font-sans-strong text-base text-on-lime">
              ЗБЕРЕГТИ
            </Text>
          </Pressable>
        </LimeGlow>
      </View>
    </View>
  );
}
