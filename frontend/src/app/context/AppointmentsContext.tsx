import React, { createContext, useContext, useState } from "react";

export type AppStatus = "Confirmado" | "Pendente" | "Cancelado";

export type Appointment = {
  id: number;
  client: string;
  procedure: string;
  date: string;   // DD/MM/YYYY
  time: string;   // HH:MM
  status: AppStatus;
  durationMin: number;
};

const initialAppointments: Appointment[] = [
  { id: 1, client: "Ana Silva",         procedure: "Limpeza de Pele",    date: "14/05/2026", time: "09:00", status: "Confirmado", durationMin: 60 },
  { id: 2, client: "Maria Santos",      procedure: "Drenagem Linfática", date: "14/05/2026", time: "10:30", status: "Confirmado", durationMin: 90 },
  { id: 3, client: "Juliana Costa",     procedure: "Peeling Químico",    date: "14/05/2026", time: "14:00", status: "Pendente",   durationMin: 45 },
  { id: 4, client: "Patricia Lima",     procedure: "Massagem Relaxante", date: "15/05/2026", time: "09:00", status: "Confirmado", durationMin: 60 },
  { id: 5, client: "Fernanda Oliveira", procedure: "Depilação a Laser",  date: "15/05/2026", time: "11:00", status: "Confirmado", durationMin: 30 },
  { id: 6, client: "Ana Silva",         procedure: "Microagulhamento",   date: "16/05/2026", time: "15:00", status: "Cancelado",  durationMin: 60 },
];

const STORAGE_KEY = "appointments_data";

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, "id">) => void;
  cancelAppointment: (id: number) => void;
}

const AppointmentsContext = createContext<AppointmentsContextValue>({
  appointments: initialAppointments,
  addAppointment: () => {},
  cancelAppointment: () => {},
});

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
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
