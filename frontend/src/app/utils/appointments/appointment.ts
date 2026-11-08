import type { Appointment, AppStatus } from "../../config/types";

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
