import {
  DOCTOR_HOURS,
  MAX_UPCOMING_APPOINTMENTS,
  SLOT_MINUTES,
  getDoctor,
} from "@/lib/doctors";
import { slotToDateKey, slotToTime } from "@/lib/format";
import { requireSupabase } from "@/lib/supabase";
import type { Appointment, BookingRow, Gender, ReceptionBooking } from "@/lib/types";

export const RECEPTION_EMAIL = "reception@reserve.com";
export const RECEPTION_PASSWORD = "123456";
const LEGACY_RECEPTION_PASSWORD = "12345";

const BOOKING_COLUMNS =
  "id, patient_id, doctor_id, slot_start, first_name, last_name, age, gender, notes, created_at";

export function isReceptionEmail(email: string | undefined | null) {
  return email?.trim().toLowerCase() === RECEPTION_EMAIL;
}

export function displayNameFromMetadata(email: string, metadata?: Record<string, unknown>) {
  const name =
    (typeof metadata?.name === "string" && metadata.name) ||
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    email.split("@")[0];
  return name;
}

function normalizeGender(gender: string | null): Gender {
  const value = (gender ?? "").toLowerCase();
  if (value === "male" || value === "female" || value === "other") return value;
  if (value === "m") return "male";
  if (value === "f") return "female";
  return "other";
}

export function rowToAppointment(row: BookingRow, email = ""): Appointment {
  const doctor = getDoctor(row.doctor_id);
  return {
    id: row.id,
    userEmail: email,
    doctorId: row.doctor_id,
    doctorName: doctor?.name ?? "Doctor",
    specialty: doctor?.specialty ?? "",
    date: slotToDateKey(row.slot_start),
    time: slotToTime(row.slot_start),
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    age: row.age ?? 0,
    gender: normalizeGender(row.gender),
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

function getAuthErrorMessage(error: { code?: string; message?: string }, isSignUp: boolean) {
  const code = error.code;
  const message = error.message ?? "";

  if (isSignUp) {
    switch (code) {
      case "user_already_exists":
      case "email_exists":
        return "An account with this email already exists.";
      case "weak_password":
        return message || "Password is too weak. Use at least 6 characters.";
      default:
        return message || "Sign up failed. Please try again.";
    }
  }

  switch (code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before signing in.";
    default:
      return message || "Sign in failed. Please try again.";
  }
}

export async function signUp(name: string, email: string, password: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim(), full_name: name.trim() } },
  });

  if (error) throw new Error(getAuthErrorMessage(error, true));
  if (!data.user?.email) throw new Error("Sign up failed. Please try again.");
  if (!data.session) {
    throw new Error("Account created. Check your email to confirm, then sign in.");
  }
  return data.session;
}

export async function signIn(email: string, password: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(getAuthErrorMessage(error, false));
  if (!data.session) throw new Error("Sign in failed. Please try again.");
  return data.session;
}

export async function signOut() {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
}

export async function checkReceptionRole() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("is_reception_user");
  if (error) return false;
  return Boolean(data);
}

async function ensureReceptionAccount(password: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: RECEPTION_EMAIL,
    password,
    options: {
      data: { role: "reception", name: "Reception Desk", full_name: "Reception Desk" },
    },
  });

  if (error && error.code !== "user_already_exists" && error.code !== "email_exists") {
    throw new Error(error.message);
  }
  if (data.session) return data.session;
  return signIn(RECEPTION_EMAIL, password);
}

export async function receptionSignIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized !== RECEPTION_EMAIL) {
    throw new Error("This page is for reception staff only.");
  }

  try {
    return await signIn(RECEPTION_EMAIL, password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const invalidCreds = message.includes("Invalid email") || message.includes("Sign in failed");

    if (invalidCreds && password === RECEPTION_PASSWORD) {
      try {
        const session = await signIn(RECEPTION_EMAIL, LEGACY_RECEPTION_PASSWORD);
        const supabase = requireSupabase();
        const { error: updateError } = await supabase.auth.updateUser({
          password: RECEPTION_PASSWORD,
        });
        if (updateError) throw updateError;
        return session;
      } catch {
        return ensureReceptionAccount(password);
      }
    }
    if (invalidCreds) return ensureReceptionAccount(password);
    throw err;
  }
}

export async function deleteAccount() {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    if (error.code === "PGRST202" || /delete_own_account/i.test(error.message)) {
      throw new Error(
        "Account deletion is not enabled yet. Run supabase/delete_own_account.sql in the Supabase SQL editor.",
      );
    }
    throw new Error(error.message);
  }
  await signOut();
}

export async function fetchDoctorBookings(doctorId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("doctor_id", doctorId)
    .order("slot_start", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BookingRow[];
}

export function isSlotTaken(rows: BookingRow[], doctorId: string, date: string, time: string) {
  const target = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
    0,
    0,
  ).toISOString();
  return rows.some(
    (row) => row.doctor_id === doctorId && new Date(row.slot_start).toISOString() === target,
  );
}

export async function getAppointments(userId: string, email: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("patient_id", userId)
    .order("slot_start", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BookingRow[]).map((row) => rowToAppointment(row, email));
}

export async function addAppointment(
  userId: string,
  email: string,
  appt: Omit<Appointment, "id" | "createdAt" | "userEmail">,
) {
  const supabase = requireSupabase();
  const nowIso = new Date().toISOString();
  const { data: existing, error: countError } = await supabase
    .from("bookings")
    .select("id, slot_start")
    .eq("patient_id", userId)
    .gt("slot_start", nowIso);

  if (countError) throw new Error(countError.message);
  if ((existing?.length ?? 0) >= MAX_UPCOMING_APPOINTMENTS) {
    throw new Error("You can have at most 3 upcoming appointments.");
  }

  const slotStart = new Date(
    Number(appt.date.slice(0, 4)),
    Number(appt.date.slice(5, 7)) - 1,
    Number(appt.date.slice(8, 10)),
    Number(appt.time.slice(0, 2)),
    Number(appt.time.slice(3, 5)),
    0,
    0,
  ).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      patient_id: userId,
      doctor_id: appt.doctorId,
      slot_start: slotStart,
      first_name: appt.firstName,
      last_name: appt.lastName,
      age: appt.age,
      gender: appt.gender,
      notes: appt.notes.trim() || null,
    })
    .select(BOOKING_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slot was just taken. Please pick another time.");
    }
    throw new Error(error.message);
  }

  return rowToAppointment(data as BookingRow, email);
}

export async function cancelAppointment(id: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getReceptionBookingsForDay(day: Date): Promise<ReceptionBooking[]> {
  const supabase = requireSupabase();
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      slot_start,
      first_name,
      last_name,
      age,
      gender,
      notes,
      doctors (name)
    `,
    )
    .gte("slot_start", dayStart.toISOString())
    .lt("slot_start", dayEnd.toISOString())
    .order("slot_start", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const record = row as {
      id: string;
      slot_start: string;
      first_name: string | null;
      last_name: string | null;
      age: number | null;
      gender: string | null;
      notes: string | null;
      doctors: { name: string } | { name: string }[] | null;
    };
    const doctors = record.doctors;
    const doctorName = Array.isArray(doctors) ? doctors[0]?.name : doctors?.name;
    return {
      id: record.id,
      slotStart: record.slot_start,
      doctorName: doctorName ?? "Doctor",
      firstName: record.first_name,
      lastName: record.last_name,
      age: record.age,
      gender: record.gender,
      notes: record.notes,
    };
  });
}

export async function receptionCreateBooking(input: {
  doctorId: string;
  slotStart: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  notes: string;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("reception_create_booking", {
    p_doctor_id: input.doctorId,
    p_slot_start: input.slotStart,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_age: input.age,
    p_gender: input.gender,
    p_notes: input.notes.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("That time slot was just taken. Choose another time.");
    }
    if (/reception_create_booking|could not find|PGRST202|Forbidden/i.test(error.message ?? "")) {
      throw new Error(
        "Reception booking is not set up yet. Run supabase/reception_staff.sql in the Supabase SQL Editor.",
      );
    }
    throw new Error(error.message);
  }
}

export async function receptionCancelBooking(bookingId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("reception_cancel_booking", { booking_id: bookingId });
  if (error) {
    if (/reception_cancel_booking|could not find|PGRST202|Forbidden/i.test(error.message ?? "")) {
      throw new Error(
        "Reception cancel is not set up yet. Run supabase/reception_staff.sql in the Supabase SQL Editor.",
      );
    }
    throw new Error(error.message);
  }
}

export function getFreeSlotsForDay(doctorId: string, day: Date, bookedIsos: Set<string>) {
  if (day.getDay() === 5) return [];

  const hours = DOCTOR_HOURS[doctorId] ?? { startHour: 9, endHour: 17 };
  const now = new Date();
  const slots: { iso: string; time: string }[] = [];

  for (let hour = hours.startHour; hour < hours.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const slot = new Date(day);
      slot.setHours(hour, minute, 0, 0);
      if (slot <= now) continue;
      const iso = slot.toISOString();
      if (!bookedIsos.has(iso)) {
        slots.push({
          iso,
          time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        });
      }
    }
  }

  return slots;
}

export async function loadBookedIsosForDay(doctorId: string, day: Date) {
  const supabase = requireSupabase();
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data, error } = await supabase
    .from("bookings")
    .select("slot_start")
    .eq("doctor_id", doctorId)
    .gte("slot_start", dayStart.toISOString())
    .lt("slot_start", dayEnd.toISOString());

  if (error) throw new Error(error.message);

  const set = new Set<string>();
  for (const row of data ?? []) {
    set.add(new Date((row as { slot_start: string }).slot_start).toISOString());
  }
  return set;
}
