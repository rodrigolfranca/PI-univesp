import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useProcedures } from "./ProceduresContext";
import { useUsers } from "./UsersContext";
import { errorMessage } from "../services/api";
import { getUser } from "../services/users";
import type { ApiUser } from "../services/users";
import * as schedulesService from "../services/schedules";
import type { ApiSchedule } from "../services/schedules";
import type { Appointment } from "../config/types";
import {
  displayDateToIso,
  displayStatusFromApi,
  isoToDisplayDate,
} from "../utils/appointments/appointment";

export type { Appointment } from "../config/types";
export type { AppStatus } from "../config/types";

export interface AppointmentInput {
  clientId: number;
  professionalId: number;
  procedureId: number;
  date: string;
  time: string;
  session: number;
}

interface AppointmentsContextValue {
  appointments: Appointment[];
  loading: boolean;
  error: string;
  reload: () => void;
  addAppointment: (appointment: AppointmentInput) => Promise<void>;
  cancelAppointment: (id: number) => Promise<void>;
  setAppointmentStatus: (id: number, status: "completed" | "absent") => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

function durationFor(schedule: ApiSchedule, procedureDuration?: number): number {
  if (schedule.session === 0) return schedule.procedure?.triagem_minutes ?? procedureDuration ?? 0;
  return schedule.procedure?.duration_minutes ?? procedureDuration ?? 60;
}

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { procedures } = useProcedures();
  const { users } = useUsers();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token) {
      setAppointments([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function load() {
      const filters = user?.role === "client" && user.clientId ? { client_id: user.clientId } : {};
      const schedules = await schedulesService.listSchedules(token!, filters, controller.signal);
      const userMap = new Map<number, ApiUser>(users.map((entry) => [entry.id, entry]));

      if (user) {
        userMap.set(user.userId, {
          id: user.userId,
          name: user.name,
          phone_number: user.phone,
          phone_number_confirmed: true,
          email: user.email,
          email_confirmed: true,
          client: user.clientId ? { id: user.clientId } : undefined,
          professional: user.professionalId
            ? { id: user.professionalId, is_admin: user.isAdmin }
            : undefined,
        });
      }

      const missingClients = [
        ...new Set(
          schedules.map((schedule) => schedule.client_id).filter((id) => !userMap.has(id)),
        ),
      ];
      await Promise.all(
        missingClients.map(async (id) => {
          try {
            const profile = await getUser(id, token!, controller.signal);
            userMap.set(id, profile);
          } catch {
            return undefined;
          }
        }),
      );

      if (controller.signal.aborted) return;

      const procedureMap = new Map(procedures.map((procedure) => [procedure.id, procedure]));
      const mapped = schedules.map((schedule): Appointment => {
        const procedure = procedureMap.get(schedule.procedure_id);
        return {
          id: schedule.id,
          clientId: schedule.client_id,
          professionalId: schedule.professional_id,
          procedureId: schedule.procedure_id,
          client: userMap.get(schedule.client_id)?.name ?? `Cliente #${schedule.client_id}`,
          procedure:
            schedule.procedure?.name ?? procedure?.name ?? `Procedimento #${schedule.procedure_id}`,
          date: isoToDisplayDate(schedule.date),
          time: schedule.start_time,
          status: displayStatusFromApi(schedule.status),
          durationMin: durationFor(schedule, procedure?.durationMinutes),
          session: schedule.session,
        };
      });
      setAppointments(mapped);
    }

    load()
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token, user, users, procedures, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  async function addAppointment(appointment: AppointmentInput): Promise<void> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    await schedulesService.createSchedule(
      {
        client_id: appointment.clientId,
        professional_id: appointment.professionalId,
        procedure_id: appointment.procedureId,
        date: displayDateToIso(appointment.date),
        start_time: appointment.time,
        session: appointment.session,
      },
      token,
    );
    reload();
  }

  async function cancelAppointment(id: number): Promise<void> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    await schedulesService.cancelSchedule(id, token);
    reload();
  }

  async function setAppointmentStatus(id: number, status: "completed" | "absent"): Promise<void> {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    await schedulesService.updateSchedule(id, { status }, token);
    reload();
  }

  return (
    <AppointmentsContext.Provider
      value={{
        appointments,
        loading,
        error,
        reload,
        addAppointment,
        cancelAppointment,
        setAppointmentStatus,
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) throw new Error("useAppointments deve ser usado dentro de AppointmentsProvider");
  return context;
}
