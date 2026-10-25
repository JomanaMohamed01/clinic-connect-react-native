import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { isFriday, isPastDay, startOfDay } from "@/lib/doctors";
import { formatMonthYear, toDateKey } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  selected: Date | null;
  onSelect: (date: Date) => void;
};

function buildWeeks(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const pad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<number | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function MonthCalendar({ selected, onSelect }: Props) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const selectedKey = selected ? toDateKey(selected) : null;
  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <View style={styles.card}>
      <View style={styles.nav}>
        <Pressable
          disabled={!canGoPrev}
          onPress={() => setCursor(new Date(year, month - 1, 1))}
          style={[styles.navButton, !canGoPrev && styles.navDisabled]}
        >
          <ChevronLeft color={colors.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>{formatMonthYear(cursor)}</Text>
        <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} style={styles.navButton}>
          <ChevronRight color={colors.ink} size={18} />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={[styles.weekday, label === "Fri" && styles.fridayLabel]}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (!day) return <View key={dayIndex} style={styles.cell} />;
            const date = new Date(year, month, day);
            const disabled = isFriday(date) || isPastDay(date);
            const active = selectedKey === toDateKey(date);
            return (
              <Pressable
                key={dayIndex}
                disabled={disabled}
                onPress={() => onSelect(date)}
                style={[styles.cell, active && styles.cellActive, disabled && styles.cellDisabled]}
              >
                <Text style={[styles.day, active && styles.dayActive, disabled && styles.dayDisabled]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blush,
  },
  navDisabled: {
    opacity: 0.35,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.muted,
    paddingVertical: 6,
  },
  fridayLabel: {
    color: colors.danger,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    margin: 2,
  },
  cellActive: {
    backgroundColor: colors.primary,
  },
  cellDisabled: {
    opacity: 0.35,
  },
  day: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 15,
  },
  dayActive: {
    color: colors.primaryInk,
  },
  dayDisabled: {
    textDecorationLine: "line-through",
  },
});
