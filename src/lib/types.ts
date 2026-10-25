export type ClinicUser = {
  id: string;
  email: string;
  name: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  color: string;
  ink: string;
  initials: string;
};

export type Gender = "male" | "female" | "other";

export type Appointment = {
  id: string;
  userEmail: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  notes: string;
  createdAt: string;
};

export type BookingRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_start: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
};

export type ReceptionBooking = {
  id: string;
  slotStart: string;
  doctorName: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  notes: string | null;
};
