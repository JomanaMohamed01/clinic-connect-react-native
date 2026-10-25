import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { AppHeader } from "@/components/AppHeader";
import { BootScreen } from "@/components/BootScreen";
import { DoctorAvatar } from "@/components/DoctorAvatar";
import { colors, fonts, shadow } from "@/constants/theme";
import { DOCTORS } from "@/lib/doctors";
import { useClinic } from "@/providers/ClinicProvider";

export default function DoctorsScreen() {
  const router = useRouter();
  const { ready, user, isReception } = useClinic();

  if (!ready) return <BootScreen />;
  if (!user) return <Redirect href="/auth" />;
  if (isReception) return <Redirect href="/reception" />;

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.title}>Choose your doctor</Text>
        <Text style={styles.sub}>Every visit is 15 minutes. Pick the specialist that fits you.</Text>
        <View style={styles.list}>
          {DOCTORS.map((doctor) => (
            <Pressable
              key={doctor.id}
              onPress={() =>
                router.push({ pathname: "/book/[doctorId]", params: { doctorId: doctor.id } })
              }
              style={[styles.card, shadow]}
            >
              <DoctorAvatar doctor={doctor} />
              <View style={styles.copy}>
                <Text style={styles.name}>{doctor.name}</Text>
                <Text style={styles.specialty}>{doctor.specialty}</Text>
                <Text style={styles.bio}>{doctor.bio}</Text>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  step: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.ink,
  },
  sub: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  copy: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  specialty: {
    marginTop: 2,
    fontFamily: fonts.sansMedium,
    color: colors.primary,
    fontSize: 14,
  },
  bio: {
    marginTop: 4,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
