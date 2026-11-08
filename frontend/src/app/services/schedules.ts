import { apiRequest } from "./api";
import type { ApiProcedure } from "./procedures";

export type ApiScheduleStatus = "scheduled" | "completed" | "canceled" | "absent";

export interface ApiSchedule {
  id: number;
  procedure_id: number;
  professional_id: number;
  client_id: number;
  document_id: number | null;
  date: string;
  start_time: string;
  session: number;
  status: ApiScheduleStatus;
  google_event_id: string | null;
  google_event_link: string | null;
  client?: {
    id: number;
    name: string | null;
    phone_number: string | null;
  } | null;
  professional?: {
    id: number;
    name: string | null;
    phone_number: string | null;
  } | null;
  procedure?: ApiProcedure;
}

export interface SchedulePayload {
  procedure_id: number;
  professional_id: number;
  client_id: number;
  document_id?: number;
  date: string;
  start_time: string;
  session: number;
}

interface SchedulePage {
  total: number;
  page: number;
  limit: number;
  data: ApiSchedule[];
}

export interface ScheduleFilters {
  professional_id?: number;
  client_id?: number;
  date?: string;
  status?: ApiScheduleStatus;
}

export interface AvailabilitySlot {
  professional_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  date?: string;
  available?: boolean;
}

export interface ProfessionalAvailability {
  name: string;
  professionalId: number;
  slots: AvailabilitySlot[];
}

export async function getAvailabilityForDate(
  token: string,
  date: string,
  signal?: AbortSignal,
): Promise<ProfessionalAvailability[]> {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const params = new URLSearchParams({
    day_of_week: String(dayOfWeek),
    date,
  });
  const result = await apiRequest<Record<string, AvailabilitySlot[]>>(
    `/work-schedules/all?${params.toString()}`,
    { token, signal },
  );
  return Object.entries(result)
    .map(([name, slots]) => ({
      name,
      professionalId: slots[0]?.professional_id ?? 0,
      slots: slots.filter((slot) => slot.available !== false),
    }))
    .filter((entry) => entry.professionalId > 0 && entry.slots.length > 0);
}

async function listSchedulePages(
  token: string,
  filters: ScheduleFilters,
  signal?: AbortSignal,
): Promise<ApiSchedule[]> {
  const schedules = new Map<number, ApiSchedule>();
  let page = 1;
  let received = 0;

  while (true) {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filters.professional_id) params.set("professional_id", String(filters.professional_id));
    if (filters.client_id) params.set("client_id", String(filters.client_id));
    if (filters.date) params.set("date", filters.date);
    if (filters.status) params.set("status", filters.status);

    const result = await apiRequest<SchedulePage>(`/schedules?${params.toString()}`, {
      token,
      signal,
    });
    result.data.forEach((schedule) => schedules.set(schedule.id, schedule));
    received += result.data.length;
    if (received >= result.total || result.data.length === 0) return [...schedules.values()];
    page += 1;
  }
}

export async function listSchedules(
  token: string,
  filters: ScheduleFilters = {},
  signal?: AbortSignal,
): Promise<ApiSchedule[]> {
  return await listSchedulePages(token, filters, signal);
}

export async function createSchedule(
  payload: SchedulePayload,
  token: string,
): Promise<ApiSchedule> {
  return await apiRequest<ApiSchedule>("/schedules", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateSchedule(
  id: number,
  payload: Partial<SchedulePayload> & { status?: ApiScheduleStatus },
  token: string,
): Promise<{ message: string }> {
  return await apiRequest<{ message: string }>(`/schedules/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function cancelSchedule(id: number, token: string): Promise<void> {
  await updateSchedule(id, { status: "canceled" }, token);
}

export async function deleteSchedule(id: number, token: string): Promise<void> {
  await apiRequest(`/schedules/${id}`, { method: "DELETE", token });
}

export async function getAvailableSlots(
  token: string,
  professionalId: number,
  date: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const params = new URLSearchParams({
    professional_id: String(professionalId),
    day_of_week: String(dayOfWeek),
    date,
  });
  const result = await apiRequest<Record<string, AvailabilitySlot[]>>(
    `/work-schedules/all?${params.toString()}`,
    { token, signal },
  );
  const slots = Object.values(result)[0] ?? [];
  return slots
    .filter((slot) => slot.available !== false)
    .map((slot) => slot.start_time)
    .sort();
}

export interface ApiWorkSchedule {
  id: number;
  professional_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export async function listWorkSchedules(
  token: string,
  professionalId?: number,
  signal?: AbortSignal,
): Promise<ApiWorkSchedule[]> {
  const params = new URLSearchParams();
  if (professionalId) params.set("professional_id", String(professionalId));
  const query = params.toString();
  return await apiRequest<ApiWorkSchedule[]>(`/work-schedules${query ? `?${query}` : ""}`, {
    token,
    signal,
  });
}

export interface WorkSchedulePayload {
  professional_id: number;
  days_of_week: number[];
  start_time: string;
  end_time: string;
}

export async function createWorkSchedule(
  payload: WorkSchedulePayload,
  token: string,
): Promise<{ message: string }> {
  return await apiRequest<{ message: string }>("/work-schedules", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateWorkSchedule(
  id: number,
  payload: Partial<Omit<WorkSchedulePayload, "days_of_week">> & { day_of_week?: number },
  token: string,
): Promise<{ message: string }> {
  return await apiRequest<{ message: string }>(`/work-schedules/update/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteWorkSchedule(id: number, token: string): Promise<void> {
  await apiRequest(`/work-schedules/delete/${id}`, { method: "DELETE", token });
}

export type ScheduleExceptionType = "blocked" | "open";

export interface ApiScheduleException {
  id: number;
  professional_id: number;
  date: string;
  type: ScheduleExceptionType;
  start_time: string | null;
  end_time: string | null;
  name: string | null;
}

interface ScheduleExceptionPage {
  total: number;
  page: number;
  limit: number;
  data: ApiScheduleException[];
}

export async function listScheduleExceptions(
  token: string,
  professionalId: number,
  signal?: AbortSignal,
): Promise<ApiScheduleException[]> {
  const exceptions = new Map<number, ApiScheduleException>();
  let page = 1;
  let received = 0;

  while (true) {
    const params = new URLSearchParams({
      professional_id: String(professionalId),
      page: String(page),
      limit: "30",
    });
    const result = await apiRequest<ScheduleExceptionPage>(
      `/schedule-exceptions?${params.toString()}`,
      { token, signal },
    );
    result.data.forEach((exception) => exceptions.set(exception.id, exception));
    received += result.data.length;
    if (received >= result.total || result.data.length === 0) {
      return [...exceptions.values()];
    }
    page += 1;
  }
}

export interface ScheduleExceptionPayload {
  professional_id: number;
  date: string;
  type: ScheduleExceptionType;
  start_time?: string | null;
  end_time?: string | null;
}

export async function createScheduleException(
  payload: ScheduleExceptionPayload,
  token: string,
): Promise<ApiScheduleException> {
  return await apiRequest<ApiScheduleException>("/schedule-exceptions", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function deleteScheduleException(id: number, token: string): Promise<void> {
  await apiRequest(`/schedule-exceptions/${id}`, { method: "DELETE", token });
}
