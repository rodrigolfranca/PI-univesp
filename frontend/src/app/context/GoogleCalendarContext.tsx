import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { errorMessage } from "../services/api";
import * as googleCalendarService from "../services/google-calendar";
import type { GoogleCalendarStatus } from "../services/google-calendar";

export const GOOGLE_CALENDAR_RETURN_KEY = "google_calendar_return_to";

interface GoogleCalendarContextValue {
  status: GoogleCalendarStatus | null;
  loading: boolean;
  error: string;
  connect: (returnTo?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sync: (scheduleId?: number) => Promise<googleCalendarService.GoogleCalendarSyncResult>;
  reload: () => void;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextValue | null>(null);

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token || !user?.isAdmin) {
      setStatus(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    googleCalendarService
      .getGoogleCalendarStatus(token, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setStatus(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.isAdmin, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  async function connect(returnTo?: string): Promise<void> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    if (returnTo) {
      sessionStorage.setItem(GOOGLE_CALENDAR_RETURN_KEY, returnTo);
    } else {
      sessionStorage.removeItem(GOOGLE_CALENDAR_RETURN_KEY);
    }
    const url = await googleCalendarService.getGoogleCalendarConnectUrl(token);
    window.location.assign(url);
  }

  async function disconnect(): Promise<void> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    await googleCalendarService.disconnectGoogleCalendar(token);
    reload();
  }

  async function sync(
    scheduleId?: number,
  ): Promise<googleCalendarService.GoogleCalendarSyncResult> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    const result = await googleCalendarService.syncGoogleCalendar(token, scheduleId);
    reload();
    return result;
  }

  return (
    <GoogleCalendarContext.Provider
      value={{ status, loading, error, connect, disconnect, sync, reload }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error("useGoogleCalendar deve ser usado dentro de GoogleCalendarProvider");
  }
  return context;
}
