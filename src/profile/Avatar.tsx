import { Image } from "expo-image";
import { Text, View } from "react-native";

import { useTheme } from "@/theme/useTheme";

import { getInitials } from "./profile-helpers";

// Аватар: фото (expo-image), якщо є URI; інакше — кружок з ініціалами.
export function Avatar({
  uri,
  name,
  size = 40,
}: {
  uri: string | null;
  name: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: radius }}
      className="items-center justify-center border border-border bg-surface-2"
    >
      <Text
        style={{ fontSize: size * 0.38, color: colors.lime }}
        className="font-sans-strong"
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
