import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stethoscope } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

export function BootScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.mark}>
        <Stethoscope color={colors.primaryInk} size={28} />
      </View>
      <Text style={styles.title}>Bloom Clinic</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
});
