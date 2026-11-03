import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "../context/BrandContext";
import { useAppointments } from "../context/AppointmentsContext";
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
  const { appointments, addAppointment, cancelAppointment } = useAppointments();
  const navigation = useAppointmentNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AppStatus | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const today = toDDMMYYYY(new Date());
  const filteredAppointments = filterAppointments(appointments, searchQuery, selectedStatus);

  function handleConfirmCancel() {
    if (!appointmentToCancel) return;
    cancelAppointment(appointmentToCancel.id);
    setAppointmentToCancel(null);
  }

  function handleCreateAppointment(appointment: Omit<Appointment, "id">) {
    addAppointment(appointment);
    setShowAddModal(false);
    toast.success("Agendamento criado", {
      description: `${appointment.client} — ${appointment.procedure} em ${appointment.date} às ${appointment.time}`,
      action: {
        label: "Adicionar ao Google Agenda",
        onClick: () => handleAddToGCal({ ...appointment, id: Date.now() }),
      },
    });
  }

  function handleAddToGCal(appointment: Appointment) {
    window.open(makeGCalUrl(appointment, clinicName), "_blank");
  }

  function handleConnectGCal() {
    toast.info("Conexão com Google Agenda", {
      description:
        "Configure suas credenciais OAuth nas Configurações para sincronização automática.",
      duration: 5000,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <AppointmentsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        view={navigation.view}
        setView={navigation.setView}
        onConnectGCal={handleConnectGCal}
      />

      {(navigation.view === "day" || navigation.view === "week") && (
        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 pb-4">
          <CalendarNavigation
            label={navigation.label}
            onPrevious={navigation.previous}
            onNext={navigation.next}
            onToday={navigation.goToToday}
            onSync={handleConnectGCal}
            alignRight={navigation.view === "day"}
          />
          <AppointmentTimeGrid
            days={navigation.view === "day" ? [navigation.dayDate] : navigation.weekDays}
            filteredAppointments={filteredAppointments}
            today={today}
            onCancel={setAppointmentToCancel}
            onGCal={handleAddToGCal}
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
            onSync={handleConnectGCal}
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
        />
      )}

      <button
        aria-label="Novo agendamento"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
      >
        <Plus className="w-6 h-6" />
      </button>
      <CancelAppointmentDialog
        appointment={appointmentToCancel}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
      {/* Manter montado preserva o rascunho ao fechar o modal. */}
      <CreateAppointmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateAppointment}
        today={today}
      />
    </div>
  );
}
