import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, shadow } from "@/constants/theme";
import { useClinic } from "@/providers/ClinicProvider";

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useClinic();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, 2800);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <Pressable
      onPress={hideToast}
      style={[
        styles.banner,
        shadow,
        {
          top: insets.top + 12,
          backgroundColor: toast.tone === "error" ? colors.danger : colors.ink,
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
});
