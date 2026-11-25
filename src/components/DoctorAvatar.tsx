import { StyleSheet, View } from "react-native";
import { Baby, HeartPulse, ScanFace, Stethoscope, type LucideIcon } from "lucide-react-native";
import type { Doctor } from "@/lib/types";

const specialtyIcons: Record<string, LucideIcon> = {
  "General Medicine": Stethoscope,
  Dermatology: ScanFace,
  Pediatrics: Baby,
  Cardiology: HeartPulse,
};

export function DoctorAvatar({ doctor, size = 56 }: { doctor: Doctor; size?: number }) {
  const Icon = specialtyIcons[doctor.specialty] ?? Stethoscope;

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
      <Icon color={doctor.ink} size={Math.round(size * 0.5)} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
});
