import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BootScreen } from "@/components/BootScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ReceptionReserveModal } from "@/components/ReceptionReserveModal";
import { colors, fonts, shadow } from "@/constants/theme";
import { getReceptionBookingsForDay, receptionCancelBooking } from "@/lib/api";
import { startOfDay } from "@/lib/doctors";
import { formatLongDate, formatMonthDay, formatMonthShort, formatTime12h } from "@/lib/format";
import type { ReceptionBooking } from "@/lib/types";
import { useClinic } from "@/providers/ClinicProvider";

export default function ReceptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, user, isReception, signOut, showToast } = useClinic();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [bookings, setBookings] = useState<ReceptionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await getReceptionBookingsForDay(selectedDate));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load reservations", "error");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showToast]);

  useFocusEffect(
    useCallback(() => {
      if (user && isReception) void load();
    }, [load, user, isReception]),
  );

  if (!ready) return <BootScreen />;
  if (!user || !isReception) return <Redirect href="/auth" />;

  const isToday = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();

  function shiftDay(amount: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + amount);
    setSelectedDate(startOfDay(next));
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    try {
      await receptionCancelBooking(pendingCancel);
      setPendingCancel(null);
      showToast("Reservation cancelled");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel", "error");
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Stethoscope color={colors.primaryInk} size={20} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Bloom Clinic</Text>
            <Text style={styles.brandSub}>Reception desk</Text>
          </View>
        </View>
        <Pressable
          style={styles.signOut}
          onPress={() => {
            void signOut().then(() => router.replace("/auth"));
          }}
        >
          <LogOut color={colors.ink} size={16} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>{isToday ? "Today's reservations" : "Reservations"}</Text>
        <Text style={styles.sub}>{formatLongDate(selectedDate)}</Text>

        <Pressable style={styles.reserve} onPress={() => setReserveOpen(true)}>
          <CalendarPlus color={colors.primaryInk} size={16} />
          <Text style={styles.reserveText}>Reserve appointment</Text>
        </Pressable>

        <View style={styles.dayRow}>
          <Pressable style={styles.dayButton} onPress={() => shiftDay(-1)}>
            <ChevronLeft color={colors.ink} size={16} />
            <Text style={styles.dayButtonText}>Previous</Text>
          </Pressable>
          {!isToday ? (
            <Pressable style={styles.dayButton} onPress={() => setSelectedDate(startOfDay(new Date()))}>
              <Text style={styles.dayButtonText}>Today</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.dayButton} onPress={() => shiftDay(1)}>
            <Text style={styles.dayButtonText}>Next</Text>
            <ChevronRight color={colors.ink} size={16} />
          </Pressable>
        </View>
        <Text style={styles.count}>
          {loading ? "Loading…" : `${bookings.length} reservation${bookings.length === 1 ? "" : "s"}`}
        </Text>

        {!loading && bookings.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList color={colors.primary} size={36} />
            <Text style={styles.emptyTitle}>No reservations</Text>
            <Text style={styles.emptyBody}>Nothing booked for {formatMonthDay(selectedDate)} yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {bookings.map((booking) => {
              const slot = new Date(booking.slotStart);
              const patientName = [booking.firstName, booking.lastName].filter(Boolean).join(" ") || "Walk-in";
              return (
                <View key={booking.id} style={[styles.card, shadow]}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.month}>{formatMonthShort(slot)}</Text>
                    <Text style={styles.time}>{formatTime12h(slot)}</Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.name}>{booking.doctorName}</Text>
                    <Text style={styles.patient}>{patientName}</Text>
                    <View style={styles.metaRow}>
                      {booking.age != null && booking.age > 0 ? (
                        <View style={styles.meta}>
                          <User color={colors.muted} size={14} />
                          <Text style={styles.metaText}>{booking.age} years</Text>
                        </View>
                      ) : null}
                      {booking.gender ? <Text style={styles.gender}>{booking.gender}</Text> : null}
                    </View>
                    {booking.notes ? <Text style={styles.notes}>“{booking.notes}”</Text> : null}
                  </View>
                  <Pressable onPress={() => setPendingCancel(booking.id)} style={styles.cancel}>
                    <Trash2 color={colors.danger} size={15} />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ReceptionReserveModal
        visible={reserveOpen}
        onClose={() => setReserveOpen(false)}
        onBooked={() => void load()}
      />
      <ConfirmModal
        visible={!!pendingCancel}
        title="Cancel this reservation?"
        message="The time slot will become available for other patients."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        destructive
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => void confirmCancel()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: "rgba(251, 247, 242, 0.94)",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, height: 56 },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  brandSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  signOut: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  signOutText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  sub: { marginTop: 4, fontFamily: fonts.sans, color: colors.muted, fontSize: 15 },
  reserve: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
  },
  reserveText: { fontFamily: fonts.sansBold, color: colors.primaryInk },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  dayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    height: 38,
  },
  dayButtonText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 13 },
  count: { marginTop: 10, marginBottom: 12, fontFamily: fonts.sans, color: colors.muted },
  empty: {
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    padding: 28,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  emptyTitle: { marginTop: 8, fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  emptyBody: { marginTop: 4, fontFamily: fonts.sans, color: colors.muted, textAlign: "center" },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 12,
  },
  timeBadge: {
    alignSelf: "flex-start",
    minWidth: 96,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  month: { fontFamily: fonts.sansBold, color: colors.primaryInk, fontSize: 11, letterSpacing: 1 },
  time: { fontFamily: fonts.display, color: colors.primaryInk, fontSize: 20, marginTop: 2 },
  copy: {},
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  patient: { fontFamily: fonts.sansMedium, color: colors.primary, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 13 },
  gender: { fontFamily: fonts.sans, color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  notes: {
    marginTop: 8,
    backgroundColor: "#F6EFE8",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.sans,
    color: colors.muted,
  },
  cancel: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6 },
  cancelText: { fontFamily: fonts.sansMedium, color: colors.danger },
});
