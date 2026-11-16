import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../context/AuthContext";
import type { ApiUser } from "../services/users";
import { admin, professional } from "../../test/fixtures";
import { AvailabilitySettings } from "./AvailabilitySettings";

const auth = vi.hoisted(() => ({
  user: null as AuthUser | null,
  token: "token" as string | null,
}));
const usersState = vi.hoisted(() => ({
  users: [] as ApiUser[],
  loading: false,
  error: "",
}));
const schedulesApi = vi.hoisted(() => ({
  createScheduleException: vi.fn(),
  createWorkSchedule: vi.fn(),
  deleteScheduleException: vi.fn(),
  deleteWorkSchedule: vi.fn(),
  listScheduleExceptions: vi.fn(),
  listWorkSchedules: vi.fn(),
  updateScheduleException: vi.fn(),
  updateWorkSchedule: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => auth,
}));
vi.mock("../context/UsersContext", () => ({
  useUsers: () => usersState,
}));
vi.mock("../services/schedules", () => schedulesApi);

function toTestAuthUser(user: ApiUser): AuthUser {
  return {
    userId: user.id,
    clientId: user.client?.id,
    professionalId: user.professional?.id,
    name: user.name,
    phone: user.phone_number,
    email: user.email,
    phoneConfirmed: user.phone_number_confirmed,
    emailConfirmed: user.email_confirmed,
    role: user.professional ? "employee" : "client",
    isAdmin: user.professional?.is_admin === true,
  };
}

beforeEach(() => {
  auth.token = "token";
  usersState.users = [];
  usersState.loading = false;
  usersState.error = "";
  Object.values(schedulesApi).forEach((mock) => mock.mockReset());
  schedulesApi.listWorkSchedules.mockResolvedValue([]);
  schedulesApi.listScheduleExceptions.mockResolvedValue([]);
  schedulesApi.createWorkSchedule.mockResolvedValue({ message: "ok" });
});

describe("AvailabilitySettings", () => {
  it("profissional usa o próprio ID, sem seletor, e cria horário para si", async () => {
    auth.user = toTestAuthUser(professional);
    render(<AvailabilitySettings />);

    await waitFor(() =>
      expect(schedulesApi.listWorkSchedules).toHaveBeenCalledWith(
        "token",
        professional.professional!.id,
        expect.any(AbortSignal),
      ),
    );
    expect(schedulesApi.listScheduleExceptions).toHaveBeenCalledWith(
      "token",
      professional.professional!.id,
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole("combobox", { name: "Profissional" })).toBeNull();
    expect(screen.getByText(professional.name)).toBeTruthy();

    const input = userEvent.setup();
    await input.click(screen.getByRole("button", { name: "Seg" }));
    await input.click(screen.getAllByRole("button", { name: "Adicionar" })[0]);

    expect(schedulesApi.createWorkSchedule).toHaveBeenCalledWith(
      {
        professional_id: professional.professional!.id,
        days_of_week: [1],
        start_time: "09:00",
        end_time: "18:00",
      },
      "token",
    );
  });

  it("admin mantém o seletor de profissionais", async () => {
    auth.user = toTestAuthUser(admin);
    usersState.users = [admin];
    render(<AvailabilitySettings />);

    await waitFor(() =>
      expect(schedulesApi.listWorkSchedules).toHaveBeenCalledWith(
        "token",
        admin.professional!.id,
        expect.any(AbortSignal),
      ),
    );
    expect(screen.getByRole("combobox", { name: "Profissional" })).toBeTruthy();
  });
});
