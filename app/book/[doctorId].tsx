import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Check, Clock } from "lucide-react-native";
import { AppHeader } from "@/components/AppHeader";
import { BootScreen } from "@/components/BootScreen";
import { DoctorAvatar } from "@/components/DoctorAvatar";
import { GradientButton } from "@/components/GradientButton";
import { MonthCalendar } from "@/components/MonthCalendar";
import { colors, fonts, shadow } from "@/constants/theme";
import { addAppointment, fetchDoctorBookings, isSlotTaken } from "@/lib/api";
import { generateTimeSlots, getDoctor, isFriday } from "@/lib/doctors";
import { formatLongDate, toDateKey } from "@/lib/format";
import type { BookingRow, Gender } from "@/lib/types";
import { useClinic } from "@/providers/ClinicProvider";

export default function BookScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const doctor = doctorId ? getDoctor(doctorId) : undefined;
  const { ready, user, isReception, showToast } = useClinic();
  const [date, setDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slots = useMemo(() => (doctor ? generateTimeSlots(doctor.id) : []), [doctor]);
  const dateKey = date ? toDateKey(date) : null;

  useEffect(() => {
    if (!doctor) return;
    void fetchDoctorBookings(doctor.id)
      .then(setRows)
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load availability", "error"));
  }, [doctor, showToast]);

  if (!ready) return <BootScreen />;
  if (!user) return <Redirect href="/auth" />;
  if (isReception) return <Redirect href="/reception" />;
  if (!doctor) return <Redirect href="/doctors" />;

  async function onConfirm() {
    if (!user || !doctor) return;
    if (!time) return showToast("Please pick a time.", "error");
    if (!date || !dateKey) return showToast("Please pick a date.", "error");
    if (isFriday(date)) return showToast("Fridays are closed — please pick another day.", "error");
    if (!firstName.trim() || !lastName.trim()) return showToast("Please enter your first and last name.", "error");
    const ageNum = Number(age);
    if (!ageNum || ageNum <= 0 || ageNum > 120) return showToast("Please enter a valid age.", "error");
    if (isSlotTaken(rows, doctor.id, dateKey, time)) {
      return showToast("That slot was just taken. Please pick another time.", "error");
    }

    setSubmitting(true);
    try {
      await addAppointment(user.id, user.email, {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        date: dateKey,
        time,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: ageNum,
        gender,
        notes: notes.trim(),
      });
      showToast("Appointment confirmed!");
      router.replace("/appointments");
    } catch (err) {
      const latest = await fetchDoctorBookings(doctor.id);
      setRows(latest);
      showToast(err instanceof Error ? err.message : "Could not book appointment", "error");
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <AppHeader />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.push("/doctors")} style={styles.back}>
            <ArrowLeft color={colors.muted} size={16} />
            <Text style={styles.backText}>Choose a different doctor</Text>
          </Pressable>

          <View style={[styles.doctorCard, shadow]}>
            <DoctorAvatar doctor={doctor} />
            <View>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
            </View>
          </View>

          <View style={styles.sectionTitle}>
            <Clock color={colors.primary} size={16} />
            <Text style={styles.sectionText}>Pick a time</Text>
            <Text style={styles.sectionHint}>(15 min each)</Text>
          </View>
          <View style={styles.slots}>
            {slots.map((slot) => {
              const taken = dateKey ? isSlotTaken(rows, doctor.id, dateKey, slot) : false;
              const active = time === slot;
              return (
                <Pressable
                  key={slot}
                  disabled={taken}
                  onPress={() => setTime(slot)}
                  style={[styles.slot, active && styles.slotActive, taken && styles.slotTaken]}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive, taken && styles.slotTextTaken]}>
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionTitle}>
            <Calendar color={colors.primary} size={16} />
            <Text style={styles.sectionText}>Pick a date</Text>
            <Text style={styles.sectionHint}>(Fridays closed)</Text>
          </View>
          <Pressable style={styles.dateButton} onPress={() => setShowCalendar((open) => !open)}>
            <Calendar color={colors.muted} size={16} />
            <Text style={[styles.dateText, !date && styles.placeholder]}>
              {date ? formatLongDate(date) : "Choose a date"}
            </Text>
          </Pressable>
          {showCalendar ? (
            <MonthCalendar
              selected={date}
              onSelect={(next) => {
                setDate(next);
                setShowCalendar(false);
              }}
            />
          ) : null}

          <View style={[styles.details, shadow]}>
            <Text style={styles.detailsTitle}>Your details</Text>
            <Text style={styles.label}>First name</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Last name</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {(["female", "male", "other"] as const).map((option) => {
                const active = gender === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setGender(option)}
                    style={[styles.gender, active && styles.slotActive]}
                  >
                    <Text style={[styles.genderText, active && styles.slotTextActive]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Anything the doctor should know?"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.notes]}
            />
          </View>

          <GradientButton
            label="Confirm reservation"
            onPress={() => void onConfirm()}
            loading={submitting}
            icon={<Check color={colors.primaryInk} size={16} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 14 },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  doctorName: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  specialty: { fontFamily: fonts.sansMedium, color: colors.primary, marginTop: 2 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 8 },
  sectionText: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sectionHint: { fontFamily: fonts.sans, color: colors.muted, fontSize: 12 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  slot: {
    width: "31%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingVertical: 10,
    alignItems: "center",
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotTaken: { opacity: 0.4 },
  slotText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 },
  slotTextActive: { color: colors.primaryInk },
  slotTextTaken: { textDecorationLine: "line-through" },
  dateButton: {
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  dateText: { fontFamily: fonts.sans, color: colors.ink, fontSize: 15 },
  placeholder: { color: colors.muted },
  details: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  detailsTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 8 },
  label: { fontFamily: fonts.sansMedium, color: colors.ink, marginBottom: 6, marginTop: 8 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 15,
  },
  notes: { height: 90, paddingTop: 12, textAlignVertical: "top" },
  genderRow: { flexDirection: "row", gap: 8 },
  gender: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  genderText: { fontFamily: fonts.sansMedium, color: colors.ink, textTransform: "capitalize" },
});
