import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useFocusEffect } from "expo-router";
import { Clock, History, User } from "lucide-react-native";
import { AppHeader } from "@/components/AppHeader";
import { BootScreen } from "@/components/BootScreen";
import { colors, fonts, shadow } from "@/constants/theme";
import { getAppointments } from "@/lib/api";
import { formatMonthShort, formatWeekdayShort, isPastVisit, parseDateKey } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { useClinic } from "@/providers/ClinicProvider";

export default function PastVisitsScreen() {
  const { ready, user, isReception, showToast } = useClinic();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const next = (await getAppointments(user.id, user.email)).filter((item) =>
        isPastVisit(item.date, item.time),
      );
      next.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      setItems(next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load past visits", "error");
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

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <Text style={styles.title}>Past visits</Text>
          <Text style={styles.sub}>
            {items.length
              ? `You have ${items.length} completed visit${items.length > 1 ? "s" : ""}.`
              : "No past visits yet."}
          </Text>
        </View>

        {items.length === 0 && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <History color={colors.primary} size={24} />
            </View>
            <Text style={styles.emptyTitle}>No past visits yet</Text>
            <Text style={styles.emptyBody}>
              Visits show up here after their appointment time has passed.
            </Text>
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
                        {item.firstName} {item.lastName}, {item.age === 1 ? "1 year" : `${item.age} years`}
                      </Text>
                    </View>
                    {item.notes ? <Text style={styles.notes}>“{item.notes}”</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  headingRow: { marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 36, color: colors.ink },
  sub: { marginTop: 4, fontFamily: fonts.sans, color: colors.muted, fontSize: 15 },
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
});
