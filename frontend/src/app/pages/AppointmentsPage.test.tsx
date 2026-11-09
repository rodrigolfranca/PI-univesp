import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentsPage } from "./AppointmentsPage";
import { renderWithSite } from "../../test/harness";
import * as schedulesService from "../services/schedules";

const state = vi.hoisted(() => ({
  appointments: [] as import("../config/types").Appointment[],
  loading: false,
  error: "",
  addAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  setAppointmentStatus: vi.fn(),
  reload: vi.fn(),
  gcalConnected: false,
  connect: vi.fn(),
  sync: vi.fn(),
  isAdmin: true,
}));
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      name: "Admin",
      phone: "",
      email: "",
      role: "employee",
      isAdmin: state.isAdmin,
      professionalId: 8,
    },
    token: "token",
  }),
}));
vi.mock("../context/UsersContext", () => ({
  useUsers: () => ({ users: [] }),
}));
vi.mock("../context/AppointmentsContext", () => ({
  useAppointments: () => ({
    appointments: state.appointments,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    addAppointment: state.addAppointment,
    cancelAppointment: state.cancelAppointment,
    deleteAppointment: state.deleteAppointment,
    setAppointmentStatus: state.setAppointmentStatus,
  }),
}));
vi.mock("../context/GoogleCalendarContext", () => ({
  useGoogleCalendar: () => ({
    status: { connected: state.gcalConnected },
    loading: false,
    connect: state.connect,
    sync: state.sync,
  }),
}));
vi.mock("../services/schedules", () => ({
  listWorkSchedules: vi.fn(),
  listScheduleExceptions: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("../components/appointments/AppointmentsHeader", () => ({
  AppointmentsHeader: ({
    setView,
    onConnectGCal,
  }: {
    setView: (view: string) => void;
    onConnectGCal: () => void;
  }) => (
    <div>
      <button onClick={() => setView("list")}>Lista</button>
      <button onClick={onConnectGCal}>Conectar GCal</button>
    </div>
  ),
}));
vi.mock("../components/appointments/CalendarNavigation", () => ({
  CalendarNavigation: ({ label, onSync }: { label: string; onSync: () => void }) => (
    <div>
      <span>{label}</span>
      <button onClick={onSync}>Sincronizar</button>
    </div>
  ),
}));
vi.mock("../components/appointments/AppointmentTimeGrid", () => ({
  AppointmentTimeGrid: ({
    filteredAppointments,
    onDetails,
    onCancel,
    onDelete,
    onGCal,
    onStatus,
  }: {
    filteredAppointments: import("../config/types").Appointment[];
    onDetails: (a: import("../config/types").Appointment) => void;
    onCancel: (a: import("../config/types").Appointment) => void;
    onDelete: (a: import("../config/types").Appointment) => void;
    onGCal: (a: import("../config/types").Appointment) => void;
    onStatus: (a: import("../config/types").Appointment, status: "completed") => void;
  }) => (
    <div>
      {filteredAppointments.map((appointment) => (
        <div key={appointment.id}>
          <span>{appointment.client}</span>
          <button onClick={() => onDetails(appointment)}>Detalhes</button>
          <button onClick={() => onCancel(appointment)}>Cancelar</button>
          <button onClick={() => onDelete(appointment)}>Excluir</button>
          <button onClick={() => onGCal(appointment)}>Google</button>
          <button onClick={() => onStatus(appointment, "completed")}>Concluir</button>
        </div>
      ))}
    </div>
  ),
}));
vi.mock("../components/appointments/AppointmentsMonthView", () => ({
  AppointmentsMonthView: () => <div>Mês</div>,
}));
vi.mock("../components/appointments/AppointmentsListView", () => ({
  AppointmentsListView: () => <div>Lista</div>,
}));
vi.mock("../components/appointments/CreateAppointmentModal", () => ({
  CreateAppointmentModal: ({
    open,
    onCreate,
  }: {
    open: boolean;
    onCreate: (input: unknown) => void;
  }) =>
    open ? (
      <button
        onClick={() =>
          onCreate({
            clientId: 7,
            professionalId: 8,
            procedureId: 1,
            date: "20/11/2026",
            time: "09:00",
            session: 1,
          })
        }
      >
        Criar agendamento
      </button>
    ) : null,
}));
vi.mock("../components/appointments/CancelAppointmentDialog", () => ({
  CancelAppointmentDialog: ({
    appointment,
    onConfirm,
  }: {
    appointment: unknown;
    onConfirm: () => void;
  }) => (appointment ? <button onClick={onConfirm}>Confirmar cancelamento</button> : null),
}));
vi.mock("../components/appointments/AppointmentDetailsDialog", () => ({
  AppointmentDetailsDialog: ({ appointment }: { appointment: { client: string } | null }) =>
    appointment ? <div>Detalhes de {appointment.client}</div> : null,
}));

const mocked = vi.mocked(schedulesService);
const appointment = {
  id: 10,
  clientId: 7,
  professionalId: 8,
  procedureId: 1,
  client: "Maria",
  clientPhone: "11999999999",
  professional: "Ana",
  professionalPhone: "11888888888",
  procedure: "Limpeza",
  date: "20/11/2026",
  time: "09:00",
  status: "Confirmado" as const,
  durationMin: 30,
  session: 1,
  googleEventLink: null,
};

describe("AppointmentsPage", () => {
  beforeEach(() => {
    state.appointments = [appointment];
    state.loading = false;
    state.error = "";
    state.gcalConnected = false;
    state.isAdmin = true;
    Object.values(state).forEach((value) => {
      if (typeof value === "function" && "mockReset" in value) value.mockReset();
    });
    Object.values(toast).forEach((fn) => fn.mockReset());
    state.addAppointment.mockResolvedValue(undefined);
    state.cancelAppointment.mockResolvedValue(undefined);
    state.deleteAppointment.mockResolvedValue(undefined);
    state.setAppointmentStatus.mockResolvedValue(undefined);
    state.connect.mockResolvedValue(undefined);
    state.sync.mockResolvedValue({ connected: true, synced: 1, failed: 0 });
    mocked.listWorkSchedules.mockResolvedValue([]);
    mocked.listScheduleExceptions.mockResolvedValue([]);
  });

  it("renderiza erro, loading e dados", () => {
    state.error = "Falha na agenda";
    state.loading = true;
    renderWithSite(<AppointmentsPage />);
    expect(screen.getByRole("alert").textContent).toContain("Falha na agenda");
    expect(screen.getByText("Carregando agendamentos...")).toBeTruthy();
    expect(screen.getByText("Maria")).toBeTruthy();
  });

  it("cria agendamento pelo modal", async () => {
    const user = userEvent.setup();
    renderWithSite(<AppointmentsPage />);
    await user.click(screen.getByRole("button", { name: "Novo agendamento" }));
    await user.click(screen.getByRole("button", { name: "Criar agendamento" }));

    await waitFor(() => expect(state.addAppointment).toHaveBeenCalled());
    expect(state.addAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 7, date: "20/11/2026" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Agendamento criado");
  });

  it("abre detalhes, cancela, conclui e conecta Google", async () => {
    const user = userEvent.setup();
    renderWithSite(<AppointmentsPage />);

    await user.click(screen.getByRole("button", { name: "Detalhes" }));
    expect(screen.getByText("Detalhes de Maria")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    await waitFor(() => expect(state.cancelAppointment).toHaveBeenCalledWith(10));

    await user.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(state.setAppointmentStatus).toHaveBeenCalledWith(10, "completed"));

    await user.click(screen.getByRole("button", { name: "Google" }));
    expect(state.connect).toHaveBeenCalled();
  });

  it("sincroniza quando Google está conectado", async () => {
    state.gcalConnected = true;
    const user = userEvent.setup();
    renderWithSite(<AppointmentsPage />);
    await user.click(screen.getByRole("button", { name: "Sincronizar" }));
    await waitFor(() => expect(state.sync).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("1 agendamentos sincronizados");
  });
});
