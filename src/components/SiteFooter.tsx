import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";

export function SiteFooter({ bleed = 0 }: { bleed?: number }) {
  const year = new Date().getFullYear();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, bleed > 0 && { marginHorizontal: -bleed }]}>
      <View style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.text}>© {year} Bloom Clinic. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: "auto",
    paddingTop: 40,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 24,
    alignItems: "center",
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
});
