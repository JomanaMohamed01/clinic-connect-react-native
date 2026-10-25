import { StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import type { Doctor } from "@/lib/types";

export function DoctorAvatar({ doctor, size = 56 }: { doctor: Doctor; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size > 48 ? 18 : 14,
          backgroundColor: doctor.color,
        },
      ]}
    >
      <Text style={[styles.initials, { color: doctor.ink, fontSize: size * 0.32 }]}>
        {doctor.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: fonts.display,
  },
});
