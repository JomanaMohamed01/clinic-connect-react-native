import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { CalendarPlus, Clock, Trash2, User } from "lucide-react-native";
import { AppHeader } from "@/components/AppHeader";
import { BootScreen } from "@/components/BootScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { colors, fonts, shadow } from "@/constants/theme";
import { cancelAppointment, getAppointments } from "@/lib/api";
import { formatMonthShort, formatWeekdayShort, parseDateKey } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { useClinic } from "@/providers/ClinicProvider";

export default function AppointmentsScreen() {
  const router = useRouter();
  const { ready, user, isReception, showToast } = useClinic();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const next = await getAppointments(user.id, user.email);
      next.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      setItems(next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!ready) return <BootScreen />;
  if (!user) return <Redirect href="/auth" />;
  if (isReception) return <Redirect href="/reception" />;

  async function confirmCancel() {
    if (!pending) return;
    try {
      await cancelAppointment(pending);
      setPending(null);
      showToast("Appointment cancelled");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not cancel appointment", "error");
    }
  }

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
      >
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My appointments</Text>
            <Text style={styles.sub}>
              {items.length
                ? `You have ${items.length} upcoming visit${items.length > 1 ? "s" : ""}.`
                : "No appointments yet."}
            </Text>
          </View>
        </View>
        <Pressable style={styles.book} onPress={() => router.push("/doctors")}>
          <CalendarPlus color={colors.primaryInk} size={16} />
          <Text style={styles.bookText}>Book new</Text>
        </Pressable>

        {items.length === 0 && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <CalendarPlus color={colors.primary} size={24} />
            </View>
            <Text style={styles.emptyTitle}>Nothing booked yet</Text>
            <Text style={styles.emptyBody}>Reserve your first 15-minute visit with one of our doctors.</Text>
            <Pressable style={styles.book} onPress={() => router.push("/doctors")}>
              <Text style={styles.bookText}>Choose a doctor</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const date = parseDateKey(item.date);
              return (
                <View key={item.id} style={[styles.card, shadow]}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.month}>{formatMonthShort(date)}</Text>
                    <Text style={styles.day}>{date.getDate()}</Text>
                    <Text style={styles.weekday}>{formatWeekdayShort(date)}</Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.name}>{item.doctorName}</Text>
                    <Text style={styles.specialty}>{item.specialty}</Text>
                    <View style={styles.meta}>
                      <Clock color={colors.muted} size={14} />
                      <Text style={styles.metaText}>{item.time} · 15 min</Text>
                    </View>
                    <View style={styles.meta}>
                      <User color={colors.muted} size={14} />
                      <Text style={styles.metaText}>
                        {item.firstName} {item.lastName}, {item.age}
                      </Text>
                    </View>
                    {item.notes ? <Text style={styles.notes}>“{item.notes}”</Text> : null}
                    <Pressable onPress={() => setPending(item.id)} style={styles.cancel}>
                      <Trash2 color={colors.danger} size={15} />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!pending}
        title="Cancel this appointment?"
        message="This can’t be undone. The time slot will free up for another patient."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmCancel()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  headingRow: { marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 36, color: colors.ink },
  sub: { marginTop: 4, fontFamily: fonts.sans, color: colors.muted, fontSize: 15 },
  book: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  bookText: { fontFamily: fonts.sansBold, color: colors.primaryInk, fontSize: 14 },
  empty: {
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 28,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.blush,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  emptyBody: {
    marginTop: 6,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  dateBadge: {
    width: 78,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  month: {
    fontFamily: fonts.sansBold,
    color: colors.primaryInk,
    fontSize: 11,
    letterSpacing: 1,
  },
  day: { fontFamily: fonts.display, color: colors.primaryInk, fontSize: 30, lineHeight: 34 },
  weekday: { fontFamily: fonts.sans, color: colors.primaryInk, fontSize: 12 },
  copy: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  specialty: { fontFamily: fonts.sansMedium, color: colors.primary, fontSize: 14, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  metaText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 13 },
  notes: {
    marginTop: 8,
    backgroundColor: "#F6EFE8",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 13,
  },
  cancel: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  cancelText: { fontFamily: fonts.sansMedium, color: colors.danger, fontSize: 14 },
});
