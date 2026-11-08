import type { Appointment, AppStatus } from "../../config/types";

export function makeGCalUrl(appointment: Appointment, clinicName: string): string {
  const [day, month, year] = appointment.date.split("/");
  const [hours, minutes] = appointment.time.split(":");
  const start = `${year}${month}${day}T${hours}${minutes}00`;
  const endDate = new Date(+year, +month - 1, +day, +hours, +minutes + appointment.durationMin);
  const end =
    [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
    ].join("") +
    "T" +
    [
      String(endDate.getHours()).padStart(2, "0"),
      String(endDate.getMinutes()).padStart(2, "0"),
      "00",
    ].join("");
  const text = encodeURIComponent(`${appointment.procedure} — ${appointment.client}`);
  const details = encodeURIComponent(`Agendamento pelo sistema ${clinicName}`);

  return `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${start}/${end}&details=${details}`;
}

export function parseDurationMin(duration: string): number {
  const match = duration.match(/(\d+)/);

  return match ? parseInt(match[1]) : 60;
}

export function filterAppointments(
  appointments: Appointment[],
  searchQuery: string,
  selectedStatus: AppStatus | "",
): Appointment[] {
  const query = searchQuery.toLowerCase();
  return appointments.filter(
    (appointment) =>
      (!selectedStatus || appointment.status === selectedStatus) &&
      (!query ||
        appointment.client.toLowerCase().includes(query) ||
        appointment.procedure.toLowerCase().includes(query)),
  );
}

export function isoToDisplayDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function displayDateToIso(date: string): string {
  const [day, month, year] = date.split("/");
  return `${year}-${month}-${day}`;
}

export function displayStatusFromApi(status: string): AppStatus {
  if (status === "completed") return "Concluído";
  if (status === "canceled") return "Cancelado";
  if (status === "absent") return "Ausente";
  return "Confirmado";
}
