import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import { useAppointments } from "../context/AppointmentsContext";
import { useGoogleCalendar } from "../context/GoogleCalendarContext";
import type { AppointmentInput } from "../context/AppointmentsContext";
import { errorMessage } from "../services/api";
import { listScheduleExceptions, listWorkSchedules } from "../services/schedules";
import type { ApiScheduleException, ApiWorkSchedule } from "../services/schedules";
import type { Appointment, AppStatus } from "../config/types";
import { useAppointmentNavigation } from "../hooks/useAppointmentNavigation";
import { filterAppointments } from "../utils/appointments/appointment";
import { buildAvailabilityBands } from "../utils/appointments/availability";
import { toDDMMYYYY } from "../utils/appointments/calendar";
import { AppointmentsHeader } from "../components/appointments/AppointmentsHeader";
import { CalendarNavigation } from "../components/appointments/CalendarNavigation";
import { AppointmentTimeGrid } from "../components/appointments/AppointmentTimeGrid";
import { AppointmentsMonthView } from "../components/appointments/AppointmentsMonthView";
import { AppointmentsListView } from "../components/appointments/AppointmentsListView";
import { CreateAppointmentModal } from "../components/appointments/CreateAppointmentModal";
import { CancelAppointmentDialog } from "../components/appointments/CancelAppointmentDialog";
import { AppointmentDetailsDialog } from "../components/appointments/AppointmentDetailsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function AppointmentsPage() {
  const { user, token } = useAuth();
  const { users } = useUsers();
  const {
    appointments,
    loading,
    error,
    reload,
    addAppointment,
    cancelAppointment,
    deleteAppointment,
    setAppointmentStatus,
  } = useAppointments();
  const {
    status: googleStatus,
    loading: googleLoading,
    connect: connectGoogleCalendar,
    sync: syncGoogleCalendar,
  } = useGoogleCalendar();
  const gcalConnected = googleStatus?.connected === true;
  const navigation = useAppointmentNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AppStatus | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [workSchedules, setWorkSchedules] = useState<ApiWorkSchedule[]>([]);
  const [scheduleExceptions, setScheduleExceptions] = useState<ApiScheduleException[]>([]);
  const today = toDDMMYYYY(new Date());
  const professionals = user?.isAdmin
    ? users
        .filter((entry) => entry.professional)
        .map((entry) => ({ id: entry.professional!.id, name: entry.name }))
    : user?.professionalId
      ? [{ id: user.professionalId, name: user.name }]
      : [];
  const availabilityProfessionalId = selectedProfessional
    ? Number(selectedProfessional)
    : (user?.professionalId ?? professionals[0]?.id);
  const statusFiltered = filterAppointments(appointments, searchQuery, selectedStatus);
  const filteredAppointments = selectedProfessional
    ? statusFiltered.filter(
        (appointment) => appointment.professionalId === Number(selectedProfessional),
      )
    : statusFiltered;
  const visibleDays =
    navigation.view === "day"
      ? [navigation.dayDate]
      : navigation.view === "week"
        ? navigation.weekDays
        : [];
  const availabilityByDate = Object.fromEntries(
    visibleDays.map((day) => [
      toDDMMYYYY(day),
      buildAvailabilityBands(day, workSchedules, scheduleExceptions),
    ]),
  );

  useEffect(() => {
    if (!token || !availabilityProfessionalId || visibleDays.length === 0) {
      setWorkSchedules([]);
      setScheduleExceptions([]);
      return;
    }

    const controller = new AbortController();
    Promise.all([
      listWorkSchedules(token, availabilityProfessionalId, controller.signal),
      listScheduleExceptions(token, availabilityProfessionalId, controller.signal),
    ])
      .then(([schedules, exceptions]) => {
        if (controller.signal.aborted) return;
        setWorkSchedules(schedules);
        setScheduleExceptions(exceptions);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setWorkSchedules([]);
          setScheduleExceptions([]);
        }
      });

    return () => controller.abort();
  }, [token, availabilityProfessionalId, navigation.view, visibleDays.length]);

  async function handleConfirmCancel() {
    if (!appointmentToCancel) return;
    try {
      await cancelAppointment(appointmentToCancel.id);
      setAppointmentToCancel(null);
      toast.success("Agendamento cancelado");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleDeleteAppointment() {
    if (!appointmentToDelete) return;
    try {
      await deleteAppointment(appointmentToDelete.id);
      toast.success("Agendamento excluído");
      setAppointmentToDelete(null);
      if (appointmentDetails?.id === appointmentToDelete.id) setAppointmentDetails(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleCreateAppointment(appointment: AppointmentInput) {
    try {
      await addAppointment(appointment);
      setShowAddModal(false);
      toast.success("Agendamento criado");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleStatus(appointment: Appointment, status: "completed" | "absent") {
    try {
      await setAppointmentStatus(appointment.id, status);
      toast.success(status === "completed" ? "Agendamento concluído" : "Ausência registrada");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleGoogleCalendarAction(appointment: Appointment) {
    if (!gcalConnected) {
      await handleConnectGCal();
      return;
    }

    try {
      const result = await syncGoogleCalendar(appointment.id);
      if (!result.connected) {
        await handleConnectGCal();
        return;
      }
      toast.success("Agendamento sincronizado com o Google Agenda");
      reload();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleConnectGCal() {
    if (gcalConnected) {
      toast.info("Google Agenda já está conectado.");
      return;
    }
    try {
      await connectGoogleCalendar("/app/appointments");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleSync() {
    if (!user?.isAdmin) {
      reload();
      toast.success("Agendamentos atualizados");
      return;
    }
    if (!gcalConnected) {
      await handleConnectGCal();
      return;
    }

    try {
      const result = await syncGoogleCalendar();
      toast.success(
        result.failed > 0
          ? `${result.synced} sincronizados, ${result.failed} falharam`
          : `${result.synced} agendamentos sincronizados`,
      );
      reload();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <p role="alert" className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 md:mx-8">
          {error}
        </p>
      )}
      <AppointmentsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        view={navigation.view}
        setView={navigation.setView}
        onConnectGCal={() => void handleConnectGCal()}
        gcalConnected={gcalConnected}
        gcalLoading={googleLoading}
        gcalAvailable={Boolean(user?.isAdmin)}
        professionals={professionals}
        selectedProfessional={selectedProfessional}
        setSelectedProfessional={setSelectedProfessional}
      />

      {(navigation.view === "day" || navigation.view === "week") && (
        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 pb-4">
          <CalendarNavigation
            label={navigation.label}
            onPrevious={navigation.previous}
            onNext={navigation.next}
            onToday={navigation.goToToday}
            onSync={() => void handleSync()}
            alignRight={navigation.view === "day"}
          />
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-50 ring-1 ring-emerald-200" />
              Disponível
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-50 ring-1 ring-blue-200" />
              Abertura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-50 ring-1 ring-red-200" />
              Bloqueio
            </span>
          </div>
          <AppointmentTimeGrid
            days={navigation.view === "day" ? [navigation.dayDate] : navigation.weekDays}
            filteredAppointments={filteredAppointments}
            today={today}
            onDetails={setAppointmentDetails}
            onCancel={setAppointmentToCancel}
            onDelete={setAppointmentToDelete}
            onGCal={(appointment) => void handleGoogleCalendarAction(appointment)}
            onStatus={(appointment, status) => void handleStatus(appointment, status)}
            gcalConnected={gcalConnected}
            canManage={Boolean(user?.isAdmin)}
            labels={navigation.view === "day" ? [navigation.dayName] : undefined}
            availabilityByDate={availabilityByDate}
          />
        </div>
      )}

      {navigation.view === "month" && (
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-4 flex flex-col">
          <CalendarNavigation
            label={navigation.label}
            onPrevious={navigation.previous}
            onNext={navigation.next}
            onToday={navigation.goToToday}
            onSync={() => void handleSync()}
          />
          <AppointmentsMonthView
            date={navigation.monthViewDate}
            appointments={filteredAppointments}
            today={today}
            onDayClick={navigation.selectDay}
          />
        </div>
      )}

      {navigation.view === "list" && (
        <AppointmentsListView
          appointments={filteredAppointments}
          onDetails={setAppointmentDetails}
          onCancel={setAppointmentToCancel}
          onDelete={setAppointmentToDelete}
          onGCal={(appointment) => void handleGoogleCalendarAction(appointment)}
          onStatus={(appointment, status) => void handleStatus(appointment, status)}
          gcalConnected={gcalConnected}
          canManage={Boolean(user?.isAdmin)}
        />
      )}

      {user?.isAdmin && (
        <button
          aria-label="Novo agendamento"
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      <CancelAppointmentDialog
        appointment={appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={() => void handleConfirmCancel()}
      />
      <AlertDialog
        open={Boolean(appointmentToDelete)}
        onOpenChange={(open) => {
          if (!open) setAppointmentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento de <strong>{appointmentToDelete?.client}</strong> será removido e o
              evento correspondente no Google também será excluído. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteAppointment()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AppointmentDetailsDialog
        appointment={appointmentDetails}
        onClose={() => setAppointmentDetails(null)}
      />
      {/* Manter montado preserva o rascunho ao fechar o modal. */}
      {user?.isAdmin && (
        <CreateAppointmentModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateAppointment}
          today={today}
        />
      )}
      {loading && (
        <p className="px-4 pb-4 text-sm text-gray-500 md:px-8">Carregando agendamentos...</p>
      )}
    </div>
  );
}
