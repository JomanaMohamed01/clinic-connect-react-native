let pendingMessage: string | null = null;
let arriveInstantly = false;
let doctorsArriveInstantly = false;

export function openDoctorsInstantly() {
  doctorsArriveInstantly = true;
}

export function shouldOpenDoctorsInstantly() {
  return doctorsArriveInstantly;
}

export function clearInstantDoctorsOpen() {
  doctorsArriveInstantly = false;
}

export function queueAppointmentNotice(message: string) {
  pendingMessage = message;
  arriveInstantly = true;
}

export function hasAppointmentNotice() {
  return pendingMessage != null;
}

export function shouldOpenAppointmentsInstantly() {
  return arriveInstantly;
}

export function clearInstantAppointmentsOpen() {
  arriveInstantly = false;
}

export function takeAppointmentNotice() {
  const message = pendingMessage;
  pendingMessage = null;
  return message;
}
