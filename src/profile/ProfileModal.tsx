import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/theme/useTheme";

import { Avatar } from "./Avatar";
import { formatJoinDate, getDisplayName } from "./profile-helpers";

// Інформаційна модалка профілю — лише перегляд, без редагування.
// Закриття: по хрестику або по тапу поза карткою. Редагування — у Налаштуваннях.
export function ProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const name = getDisplayName(profile);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Затемнений фон — тап закриває */}
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/70 px-8"
      >
        {/* Картка. Зупиняємо проброс тапу, щоб тап усередині не закривав */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ minHeight: height * 0.6 }}
          className="w-full rounded-3xl border border-border bg-surface p-6"
        >
          {/* Хрестик праворуч зверху */}
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityLabel="Закрити"
            className="absolute right-3 top-3 p-1 active:opacity-70"
          >
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={colors.textDim}
            />
          </Pressable>

          {/* Аватар + ім'я */}
          <View className="items-center pt-2">
            <Avatar uri={profile?.avatar_uri ?? null} name={name} size={88} />
            <Text className="mt-3 font-sans-strong text-xl text-text">
              {name}
            </Text>
            <Text className="mt-0.5 font-mono text-xs text-text-dim">
              @{profile?.username}
            </Text>
          </View>

          <View className="my-5 h-px bg-border" />

          {/* Активна програма */}
          <View className="flex-row items-baseline justify-between">
            <Text className="font-mono text-[11px] tracking-[2px] text-lime">
              АКТИВНА ПРОГРАМА
            </Text>
            <Text className="font-sans text-sm text-text-muted">
              не вибрана
            </Text>
          </View>

          {/* Простір під майбутні блоки */}
          <View className="flex-1" />

          {/* Учасник з ... — притиснуто до низу картки */}
          {profile?.created_at ? (
            <Text className="text-center font-mono text-[11px] text-text-dim">
              Учасник з {formatJoinDate(profile.created_at)}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
