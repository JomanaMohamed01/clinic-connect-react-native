let pendingMessage: string | null = null;

export function queueAppointmentNotice(message: string) {
  pendingMessage = message;
}

export function hasAppointmentNotice() {
  return pendingMessage != null;
}

export function takeAppointmentNotice() {
  const message = pendingMessage;
  pendingMessage = null;
  return message;
}
