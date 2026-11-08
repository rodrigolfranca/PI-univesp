import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "../context/BrandContext";
import { useAuth } from "../context/AuthContext";
import { useAppointments } from "../context/AppointmentsContext";
import { useGoogleCalendar } from "../context/GoogleCalendarContext";
import type { AppointmentInput } from "../context/AppointmentsContext";
import { errorMessage } from "../services/api";
import type { Appointment, AppStatus } from "../config/types";
import { useAppointmentNavigation } from "../hooks/useAppointmentNavigation";
import { filterAppointments, makeGCalUrl } from "../utils/appointments/appointment";
import { toDDMMYYYY } from "../utils/appointments/calendar";
import { AppointmentsHeader } from "../components/appointments/AppointmentsHeader";
import { CalendarNavigation } from "../components/appointments/CalendarNavigation";
import { AppointmentTimeGrid } from "../components/appointments/AppointmentTimeGrid";
import { AppointmentsMonthView } from "../components/appointments/AppointmentsMonthView";
import { AppointmentsListView } from "../components/appointments/AppointmentsListView";
import { CreateAppointmentModal } from "../components/appointments/CreateAppointmentModal";
import { CancelAppointmentDialog } from "../components/appointments/CancelAppointmentDialog";

export function AppointmentsPage() {
  const { name: clinicName } = useBrand();
  const { user } = useAuth();
  const {
    appointments,
    loading,
    error,
    reload,
    addAppointment,
    cancelAppointment,
    setAppointmentStatus,
  } = useAppointments();
  const {
    status: googleStatus,
    loading: googleLoading,
    connect: connectGoogleCalendar,
  } = useGoogleCalendar();
  const gcalConnected = googleStatus?.connected === true;
  const navigation = useAppointmentNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AppStatus | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const today = toDDMMYYYY(new Date());
  const filteredAppointments = filterAppointments(appointments, searchQuery, selectedStatus);

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

  function handleAddToGCal(appointment: Appointment) {
    window.open(makeGCalUrl(appointment, clinicName), "_blank");
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

  function handleSync() {
    if (!user?.isAdmin || gcalConnected) {
      reload();
      toast.success("Agendamentos atualizados");
      return;
    }
    void handleConnectGCal();
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
      />

      {(navigation.view === "day" || navigation.view === "week") && (
        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 pb-4">
          <CalendarNavigation
            label={navigation.label}
            onPrevious={navigation.previous}
            onNext={navigation.next}
            onToday={navigation.goToToday}
            onSync={handleSync}
            alignRight={navigation.view === "day"}
          />
          <AppointmentTimeGrid
            days={navigation.view === "day" ? [navigation.dayDate] : navigation.weekDays}
            filteredAppointments={filteredAppointments}
            today={today}
            onCancel={setAppointmentToCancel}
            onGCal={handleAddToGCal}
            onStatus={(appointment, status) => void handleStatus(appointment, status)}
            gcalConnected={gcalConnected}
            canManage={Boolean(user?.isAdmin)}
            labels={navigation.view === "day" ? [navigation.dayName] : undefined}
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
            onSync={handleSync}
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
          onCancel={setAppointmentToCancel}
          onGCal={handleAddToGCal}
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
