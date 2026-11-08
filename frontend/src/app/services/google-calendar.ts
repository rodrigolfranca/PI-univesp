import { apiRequest } from "./api";

export interface GoogleCalendarStatus {
  connected: boolean;
  professional_id: number | null;
  calendar_id: string | null;
}

export async function getGoogleCalendarStatus(
  token: string,
  signal?: AbortSignal,
): Promise<GoogleCalendarStatus> {
  return await apiRequest<GoogleCalendarStatus>("/google-calendar/status", { token, signal });
}

export async function getGoogleCalendarConnectUrl(token: string): Promise<string> {
  const result = await apiRequest<{ url: string }>("/google-calendar/connect", { token });
  return result.url;
}

export async function disconnectGoogleCalendar(token: string): Promise<void> {
  await apiRequest("/google-calendar/disconnect", { method: "DELETE", token });
}

export interface GoogleCalendarSyncResult {
  connected: boolean;
  synced: number;
  failed: number;
}

export async function syncGoogleCalendar(
  token: string,
  scheduleId?: number,
): Promise<GoogleCalendarSyncResult> {
  return await apiRequest<GoogleCalendarSyncResult>("/google-calendar/sync", {
    method: "POST",
    token,
    body: scheduleId ? { schedule_id: scheduleId } : {},
  });
}
