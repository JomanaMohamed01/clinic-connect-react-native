import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function GradientButton({ label, onPress, disabled, loading, icon }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={inactive} style={({ pressed }) => [{ opacity: inactive ? 0.6 : pressed ? 0.92 : 1 }]}>
      <LinearGradient
        colors={["#E59A7A", "#D47262"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryInk} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: colors.primaryInk,
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
});
