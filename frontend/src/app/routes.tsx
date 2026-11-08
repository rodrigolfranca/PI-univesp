import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { ClientLayout } from "./components/ClientLayout";
import { EmployeeGuard } from "./components/EmployeeGuard";
import { ClienteGuard } from "./components/ClienteGuard";
import { LandingPage } from "./pages/LandingPage";
import { TratamentosPage } from "./pages/TratamentosPage";
import { SobrePage } from "./pages/SobrePage";
import { ContatoPage } from "./pages/ContatoPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { ProceduresPage } from "./pages/ProceduresPage";
import { ProcedureDetailPage } from "./pages/ProcedureDetailPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { AgendarPage } from "./pages/AgendarPage";
import { ClienteAgendamentosPage } from "./pages/cliente/ClienteAgendamentosPage";
import { ClienteNovoAgendamentoPage } from "./pages/cliente/ClienteNovoAgendamentoPage";
import { ClienteNotificacoesPage } from "./pages/cliente/ClienteNotificacoesPage";
import { ClientePerfilPage } from "./pages/cliente/ClientePerfilPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/tratamentos",
    Component: TratamentosPage,
  },
  {
    path: "/sobre",
    Component: SobrePage,
  },
  {
    path: "/contato",
    Component: ContatoPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/agendar/:treatmentId",
    Component: AgendarPage,
  },
  {
    path: "/app",
    Component: EmployeeGuard,
    children: [
      {
        Component: RootLayout,
        children: [
          { index: true, Component: AppointmentsPage },
          { path: "clients", Component: ClientsPage },
          { path: "clients/:id", Component: ClientDetailPage },
          { path: "procedures", Component: ProceduresPage },
          { path: "procedures/:id", Component: ProcedureDetailPage },
          { path: "appointments", Component: AppointmentsPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "availability", Component: AvailabilityPage },
          { path: "settings", Component: SettingsPage },
          { path: "employees", Component: EmployeesPage },
          { path: "employees/:id", Component: EmployeeDetailPage },
          { path: "change-password", Component: ChangePasswordPage },
          { path: "categories", Component: CategoriesPage },
        ],
      },
    ],
  },
  {
    path: "/cliente",
    Component: ClienteGuard,
    children: [
      {
        Component: ClientLayout,
        children: [
          { path: "agendamentos", Component: ClienteAgendamentosPage },
          { path: "novo", Component: ClienteNovoAgendamentoPage },
          { path: "notificacoes", Component: ClienteNotificacoesPage },
          { path: "perfil", Component: ClientePerfilPage },
        ],
      },
    ],
  },
]);
