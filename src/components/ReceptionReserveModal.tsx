import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Clock } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { GradientButton } from "@/components/GradientButton";
import { MonthCalendar } from "@/components/MonthCalendar";
import { DOCTORS, buildSlotStartIso, isFriday, startOfDay } from "@/lib/doctors";
import { formatLongDate } from "@/lib/format";
import {
  getFreeSlotsForDay,
  loadBookedIsosForDay,
  receptionCreateBooking,
} from "@/lib/api";
import type { Gender } from "@/lib/types";
import { useClinic } from "@/providers/ClinicProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onBooked: () => void;
};

export function ReceptionReserveModal({ visible, onClose, onBooked }: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useClinic();
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<Date | null>(startOfDay(new Date()));
  const [time, setTime] = useState<string | null>(null);
  const [bookedIsos, setBookedIsos] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [notes, setNotes] = useState("");

  const freeSlots = useMemo(() => {
    if (!doctorId || !date) return [];
    return getFreeSlotsForDay(doctorId, date, bookedIsos);
  }, [doctorId, date, bookedIsos]);

  useEffect(() => {
    if (!visible) return;
    setDoctorId("");
    setDate(startOfDay(new Date()));
    setTime(null);
    setFirstName("");
    setLastName("");
    setAge("");
    setGender("female");
    setNotes("");
    setBookedIsos(new Set());
    setShowCalendar(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || !doctorId || !date) {
      setBookedIsos(new Set());
      return;
    }
    setLoadingSlots(true);
    void loadBookedIsosForDay(doctorId, date)
      .then(setBookedIsos)
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load availability", "error"))
      .finally(() => setLoadingSlots(false));
  }, [visible, doctorId, date, showToast]);

  useEffect(() => {
    if (time && !freeSlots.some((slot) => slot.time === time)) {
      setTime(freeSlots[0]?.time ?? null);
    } else if (!time && freeSlots[0]) {
      setTime(freeSlots[0].time);
    }
  }, [freeSlots, time]);

  async function onSubmit() {
    if (!doctorId) return showToast("Select a doctor.", "error");
    if (!date) return showToast("Select a date.", "error");
    if (isFriday(date)) return showToast("Fridays are closed.", "error");
    if (!time) return showToast("Pick an available time.", "error");
    const ageNum = Number(age);
    if (!firstName.trim() || !lastName.trim()) return showToast("First and last name are required.", "error");
    if (!ageNum || ageNum <= 0 || ageNum > 150) return showToast("Enter a valid age.", "error");

    setSubmitting(true);
    try {
      await receptionCreateBooking({
        doctorId,
        slotStart: buildSlotStartIso(date, time),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: ageNum,
        gender,
        notes,
      });
      showToast("Appointment reserved.");
      onBooked();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reserve appointment", "error");
      if (doctorId && date) setBookedIsos(await loadBookedIsosForDay(doctorId, date));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => !submitting && onClose()}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Reserve appointment</Text>
          <Text style={styles.sub}>Book a walk-in patient. Their details are stored on the reservation.</Text>

          <Text style={styles.label}>Doctor</Text>
          <View style={styles.doctorGrid}>
            {DOCTORS.map((doctor) => {
              const active = doctorId === doctor.id;
              return (
                <Pressable
                  key={doctor.id}
                  onPress={() => {
                    setDoctorId(doctor.id);
                    setTime(null);
                  }}
                  style={[styles.doctorCard, active && styles.doctorActive]}
                >
                  <Text style={[styles.doctorName, active && styles.onPrimary]}>{doctor.name}</Text>
                  <Text style={[styles.doctorSpecialty, active && styles.onPrimarySoft]}>{doctor.specialty}</Text>
                </Pressable>
              );
            })}
          </View>

          {doctorId ? (
            <>
              <View style={styles.sectionLabel}>
                <Calendar color={colors.primary} size={16} />
                <Text style={styles.label}>Date</Text>
              </View>
              <Pressable style={styles.dateButton} onPress={() => setShowCalendar((open) => !open)}>
                <Calendar color={colors.muted} size={16} />
                <Text style={styles.dateText}>{date ? formatLongDate(date) : "Choose a date"}</Text>
              </Pressable>
              {showCalendar ? (
                <MonthCalendar
                  selected={date}
                  onSelect={(next) => {
                    setDate(next);
                    setTime(null);
                    setShowCalendar(false);
                  }}
                />
              ) : null}

              <View style={styles.sectionLabel}>
                <Clock color={colors.primary} size={16} />
                <Text style={styles.label}>Time</Text>
                {loadingSlots ? <Text style={styles.hint}>Loading…</Text> : null}
              </View>
              {date && isFriday(date) ? (
                <Text style={styles.hint}>Clinic is closed on Fridays.</Text>
              ) : freeSlots.length === 0 ? (
                <Text style={styles.hint}>No open slots on this date.</Text>
              ) : (
                <View style={styles.slotGrid}>
                  {freeSlots.map((slot) => {
                    const active = time === slot.time;
                    return (
                      <Pressable
                        key={slot.iso}
                        onPress={() => setTime(slot.time)}
                        style={[styles.slot, active && styles.slotActive]}
                      >
                        <Text style={[styles.slotText, active && styles.onPrimary]}>{slot.time}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : null}

          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Patient details</Text>
            <View style={styles.pair}>
              <Field label="First name" value={firstName} onChangeText={setFirstName} />
              <Field label="Last name" value={lastName} onChangeText={setLastName} />
            </View>
            <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
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
                    <Text style={[styles.genderText, active && styles.onPrimary]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[styles.input, styles.notes]}
              placeholder="Anything the doctor should know?"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.footer}>
            <Pressable disabled={submitting} onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <GradientButton
                label={submitting ? "Saving…" : "Confirm reservation"}
                onPress={() => void onSubmit()}
                loading={submitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
  },
  sub: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 8,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  doctorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  doctorCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 12,
  },
  doctorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doctorName: {
    fontFamily: fonts.sansBold,
    color: colors.ink,
    fontSize: 14,
  },
  doctorSpecialty: {
    marginTop: 2,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 12,
  },
  dateButton: {
    height: 48,
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
  dateText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 14,
  },
  hint: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    width: "31%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingVertical: 10,
    alignItems: "center",
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 14,
  },
  onPrimary: {
    color: colors.primaryInk,
  },
  onPrimarySoft: {
    color: "rgba(255,248,244,0.9)",
  },
  details: {
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 14,
  },
  detailsTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  pair: {
    gap: 8,
  },
  field: {
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 15,
  },
  notes: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  gender: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  genderText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 13,
    textTransform: "capitalize",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cancel: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
  },
});
