const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLongDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatMonthYear(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthShort(date: Date) {
  return MONTHS_SHORT[date.getMonth()].toUpperCase();
}

export function formatWeekdayShort(date: Date) {
  return WEEKDAYS_SHORT[date.getDay()];
}

export function formatMonthDay(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** 12-hour clock with AM/PM. */
export function formatTime12h(date: Date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? "PM" : "AM";
  let hour12 = hours24 % 12;
  if (hour12 === 0) hour12 = 12;
  const mm = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${hour12}:${mm} ${period}`;
}

export function slotKeyToDate(slotStart: string) {
  return new Date(slotStart);
}

export function slotToDateKey(slotStart: string) {
  return toDateKey(slotKeyToDate(slotStart));
}

export function slotToTime(slotStart: string) {
  const date = slotKeyToDate(slotStart);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const VISIT_MINUTES = 30;

export function appointmentStartsAt(dateKey: string, time: string) {
  return new Date(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
  );
}

/** A visit is past once its 30-minute slot has ended. */
export function isPastVisit(dateKey: string, time: string, now = new Date()) {
  return appointmentStartsAt(dateKey, time).getTime() + VISIT_MINUTES * 60 * 1000 <= now.getTime();
}
