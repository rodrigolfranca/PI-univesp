import { useSite, useStorageKey } from "../config/SiteContext";
import type { Appointment } from "../config/types";
import React, { createContext, useContext, useState } from "react";

export type { Appointment } from "../config/types";

export type { AppStatus } from "../config/types";

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, "id">) => void;
  cancelAppointment: (id: number) => void;
}

const AppointmentsContext = createContext<AppointmentsContextValue>({
  appointments: [],
  addAppointment: () => {},
  cancelAppointment: () => {},
});

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const site = useSite();
  const STORAGE_KEY = useStorageKey("appointments_data");
  // TODO(integracao): conectar a agenda à API em uma próxima etapa; estes dados são demonstrativos.
  const initialAppointments = site.data.appointments;
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialAppointments;
    } catch {
      return initialAppointments;
    }
  });

  function save(next: Appointment[]) {
    setAppointments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addAppointment(data: Omit<Appointment, "id">) {
    const newId = appointments.length > 0 ? Math.max(...appointments.map((a) => a.id)) + 1 : 1;
    save([...appointments, { id: newId, ...data }]);
  }

  function cancelAppointment(id: number) {
    save(appointments.map((a) => (a.id === id ? { ...a, status: "Cancelado" } : a)));
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, cancelAppointment }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  return useContext(AppointmentsContext);
}
