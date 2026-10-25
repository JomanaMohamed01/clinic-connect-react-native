import type { Doctor } from "@/lib/types";

/** Per-doctor clinic hours. Same IDs as the clinic-connect website. */
export const DOCTOR_HOURS: Record<string, { startHour: number; endHour: number }> = {
  "11111111-1111-1111-1111-111111111111": { startHour: 9, endHour: 15 },
  "22222222-2222-2222-2222-222222222222": { startHour: 10, endHour: 18 },
  "33333333-3333-3333-3333-333333333333": { startHour: 8, endHour: 14 },
  "44444444-4444-4444-4444-444444444444": { startHour: 12, endHour: 20 },
};

export const SLOT_MINUTES = 15;
export const MAX_UPCOMING_APPOINTMENTS = 3;

export const DOCTORS: Doctor[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Dr. Salma",
    specialty: "General Medicine",
    bio: "Family care and everyday health checkups.",
    color: "#F0C9B0",
    ink: "#4E382E",
    initials: "SA",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Dr. Ahmed",
    specialty: "Dermatology",
    bio: "Skin, hair, and cosmetic consultations.",
    color: "#B7DCC8",
    ink: "#24382C",
    initials: "AH",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Dr. Sara",
    specialty: "Pediatrics",
    bio: "Gentle care for infants, kids, and teens.",
    color: "#F3E0D0",
    ink: "#4E382E",
    initials: "SR",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Dr. Ali",
    specialty: "Cardiology",
    bio: "Heart health screenings and follow-ups.",
    color: "#E08B78",
    ink: "#FFF8F4",
    initials: "AL",
  },
];

export function getDoctor(id: string) {
  return DOCTORS.find((doctor) => doctor.id === id);
}

export function generateTimeSlots(doctorId: string): string[] {
  const hours = DOCTOR_HOURS[doctorId] ?? { startHour: 9, endHour: 17 };
  const slots: string[] = [];
  for (let hour = hours.startHour; hour < hours.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
}

export function buildSlotDate(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function slotIso(date: string, time: string): string {
  return buildSlotDate(date, time).toISOString();
}

export function buildSlotStartIso(date: Date, time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const slot = new Date(date);
  slot.setHours(hour, minute, 0, 0);
  return slot.toISOString();
}

export function isFriday(date: Date) {
  return date.getDay() === 5;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isPastDay(date: Date) {
  return startOfDay(date) < startOfDay(new Date());
}
