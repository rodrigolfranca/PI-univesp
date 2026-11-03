import { useTerminology } from "../config/SiteContext";
import React, { useState } from "react";
import {
  Search,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  MoreVertical,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Ban,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  List,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { useBrand } from "../context/BrandContext";
import { useAppointments, Appointment } from "../context/AppointmentsContext";
import { useProcedures } from "../context/ProceduresContext";
import { useClients } from "../context/ClientsContext";

// ── Types ──────────────────────────────────────────────────────────────────
type AppStatus = "Confirmado" | "Pendente" | "Cancelado";
type ViewMode = "day" | "week" | "month" | "list";

// ── Google Calendar URL ────────────────────────────────────────────────────
function makeGCalUrl(appt: Appointment, clinicName: string): string {
  const [d, m, y] = appt.date.split("/");
  const [hh, mm] = appt.time.split(":");
  const start = `${y}${m}${d}T${hh}${mm}00`;
  const endDate = new Date(+y, +m - 1, +d, +hh, +mm + appt.durationMin);
  const end =
    [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
    ].join("") +
    "T" +
    [
      String(endDate.getHours()).padStart(2, "0"),
      String(endDate.getMinutes()).padStart(2, "0"),
      "00",
    ].join("");
  const text = encodeURIComponent(`${appt.procedure} — ${appt.client}`);
  const details = encodeURIComponent(`Agendamento pelo sistema ${clinicName}`);
  return `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${start}/${end}&details=${details}`;
}

// ── Time-grid helpers ──────────────────────────────────────────────────────
const SLOT_H = 52;
const DAY_START = 9;
const DAY_END = 18;
function getMondayOf(d: Date): Date {
  const day = new Date(d);
  const dow = day.getDay() === 0 ? 6 : day.getDay() - 1;
  day.setDate(day.getDate() - dow);
  day.setHours(0, 0, 0, 0);
  return day;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function toDDMMYYYY(d: Date): string {
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("/");
}
function timeToTop(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (((h - DAY_START) * 60 + m) / 30) * SLOT_H;
}
function durationToHeight(min: number): number {
  return (min / 30) * SLOT_H - 3;
}
function getMonthGrid(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(new Date(year, month, i));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}
const STATUS_STYLE: Record<
  AppStatus,
  {
    block: string;
    badge: string;
    chip: string;
  }
> = {
  Confirmado: {
    block: "bg-brand-600 border-brand-700 text-white",
    badge: "bg-green-100 text-green-700",
    chip: "bg-brand-600 text-white",
  },
  Pendente: {
    block: "bg-amber-400 border-amber-500 text-amber-900",
    badge: "bg-yellow-100 text-yellow-700",
    chip: "bg-amber-400 text-amber-900",
  },
  Cancelado: {
    block: "bg-gray-300 border-gray-400 text-gray-600 line-through opacity-60",
    badge: "bg-red-100 text-red-700",
    chip: "bg-gray-300 text-gray-600 line-through opacity-60",
  },
};
const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEK_DAYS_LONG = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
function parseDurationMin(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : 60;
}
const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

// ── Shared time-grid component ─────────────────────────────────────────────
function TimeGrid({
  days,
  filteredAppointments,
  today,
  onCancel,
  onGCal,
  labels,
}: {
  days: Date[];
  filteredAppointments: Appointment[];
  today: string;
  onCancel: (a: Appointment) => void;
  onGCal: (a: Appointment) => void;
  labels?: string[];
}) {
  const hourSlots = Array.from(
    {
      length: (DAY_END - DAY_START) * 2,
    },
    (_, i) => {
      const totalMin = i * 30;
      const h = DAY_START + Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    },
  );
  const totalHeight = hourSlots.length * SLOT_H;
  const cols = days.length;
  return (
    <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header row */}
      <div
        className="grid sticky top-0 z-10 bg-white border-b border-gray-200"
        style={{
          gridTemplateColumns: `52px repeat(${cols}, 1fr)`,
        }}
      >
        <div className="border-r border-gray-200" />
        {days.map((day, i) => {
          const dateStr = toDDMMYYYY(day);
          const isToday = dateStr === today;
          const dow = day.getDay() === 0 ? 6 : day.getDay() - 1;
          const label = labels ? labels[i] : WEEK_DAYS[dow];
          return (
            <div
              key={i}
              className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? "bg-brand-50" : ""}`}
            >
              <p
                className={`text-xs font-medium ${isToday ? "text-brand-600" : "text-gray-500"}`}
              >
                {label}
              </p>
              <p
                className={`text-lg font-semibold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-brand-600 text-white" : "text-gray-900"}`}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid body */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `52px repeat(${cols}, 1fr)`,
        }}
      >
        {/* Time labels */}
        <div className="border-r border-gray-200">
          {hourSlots.map((slot, i) => (
            <div
              key={slot}
              className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
              style={{
                height: SLOT_H,
              }}
            >
              {i % 2 === 0 && (
                <span className="text-xs text-gray-400 leading-none">
                  {slot}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, colIdx) => {
          const dateStr = toDDMMYYYY(day);
          const isToday = dateStr === today;
          const dayAppts = filteredAppointments.filter(
            (a) => a.date === dateStr,
          );
          return (
            <div
              key={colIdx}
              className={`relative border-r border-gray-100 last:border-r-0 ${isToday ? "bg-brand-50/30" : ""}`}
              style={{
                height: totalHeight,
              }}
            >
              {hourSlots.map((_, i) => (
                <div
                  key={i}
                  className={`absolute left-0 right-0 border-b ${i % 2 === 0 ? "border-gray-200" : "border-gray-100"}`}
                  style={{
                    top: i * SLOT_H,
                    height: SLOT_H,
                  }}
                />
              ))}

              {dayAppts.map((appt) => {
                const topPx = timeToTop(appt.time);
                const heightPx = durationToHeight(appt.durationMin);
                const styles = STATUS_STYLE[appt.status];
                return (
                  <div
                    key={appt.id}
                    className={`absolute left-1 right-1 rounded-md border-l-4 px-1.5 py-1 overflow-hidden cursor-pointer group ${styles.block}`}
                    style={{
                      top: topPx,
                      height: heightPx,
                      minHeight: 20,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {appt.client}
                        </p>
                        {heightPx > 30 && (
                          <p className="text-xs truncate opacity-80 leading-tight">
                            {appt.procedure}
                          </p>
                        )}
                        {heightPx > 50 && (
                          <p className="text-xs opacity-70 leading-tight">
                            {appt.time}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-all flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[80]">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                            onSelect={() => onGCal(appt)}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Adicionar ao Google Agenda
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={appt.status === "Cancelado"}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
                            onSelect={() => onCancel(appt)}
                          >
                            <Ban className="w-4 h-4" />
                            Cancelar agendamento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AppointmentsPage() {
  const copy = useTerminology();
  const { name: clinicName } = useBrand();
  const { appointments, addAppointment, cancelAppointment } = useAppointments();
  const { procedures } = useProcedures();
  const { clients } = useClients();
  const [view, setView] = useState<ViewMode>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AppStatus | "">("");
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [dayDate, setDayDate] = useState(() => new Date());
  const [monthViewDate, setMonthViewDate] = useState(() => new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selProcedure, setSelProcedure] = useState("");
  const [selClient, setSelClient] = useState("");
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selTime, setSelTime] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);
  const [gcalConnected] = useState(false);

  // Derived
  const weekDays = Array.from(
    {
      length: 7,
    },
    (_, i) => addDays(weekStart, i),
  );
  const weekLabel = (() => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth())
      return `${weekStart.getDate()}–${end.getDate()} de ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    return `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  })();
  const dayDow = dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1;
  const dayLabel = `${WEEK_DAYS_LONG[dayDow]}, ${dayDate.getDate()} de ${MONTH_NAMES[dayDate.getMonth()]} de ${dayDate.getFullYear()}`;
  const monthGrid = getMonthGrid(monthViewDate);
  const monthLabel = `${MONTH_NAMES[monthViewDate.getMonth()]} ${monthViewDate.getFullYear()}`;
  const today = toDDMMYYYY(new Date());
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = !selectedStatus || a.status === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      a.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.procedure.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handlers
  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;
    cancelAppointment(appointmentToCancel.id);
    setAppointmentToCancel(null);
  };
  const handleCreateAppointment = () => {
    if (!selProcedure || !selClient || !selDate || !selTime) return;
    const proc = procedures.find((p) => p.name === selProcedure);
    const newAppt: Omit<Appointment, "id"> = {
      client: selClient,
      procedure: selProcedure,
      date: selDate,
      time: selTime,
      status: "Pendente",
      durationMin: proc ? parseDurationMin(proc.duration) : 60,
    };
    addAppointment(newAppt);
    setShowAddModal(false);
    setSelProcedure("");
    setSelClient("");
    setSelDate(null);
    setSelTime("");
    const gcalAppt = {
      ...newAppt,
      id: Date.now(),
    };
    toast.success("Agendamento criado", {
      description: `${selClient} — ${selProcedure} em ${selDate} às ${selTime}`,
      action: {
        label: "Adicionar ao Google Agenda",
        onClick: () => window.open(makeGCalUrl(gcalAppt, clinicName), "_blank"),
      },
    });
  };
  const handleAddToGCal = (appt: Appointment) => {
    window.open(makeGCalUrl(appt, clinicName), "_blank");
  };
  const handleConnectGCal = () => {
    toast.info("Conexão com Google Agenda", {
      description:
        "Configure suas credenciais OAuth nas Configurações para sincronização automática.",
      duration: 5000,
    });
  };

  // Navigate month-view day click → day view
  const handleMonthDayClick = (d: Date) => {
    setDayDate(d);
    setView("day");
  };

  // Calendar helpers (for new appointment modal)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  const handleDayClick = (day: number) => {
    const str = `${String(day).padStart(2, "0")}/${String(calMonth.getMonth() + 1).padStart(2, "0")}/${calMonth.getFullYear()}`;
    setSelDate(str);
  };

  // ── View toggle config ──────────────────────────────────────────────────
  const viewButtons: {
    id: ViewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "day",
      label: "Dia",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "week",
      label: "Semana",
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: "month",
      label: "Mês",
      icon: <CalendarIcon className="w-4 h-4" />,
    },
    {
      id: "list",
      label: "Lista",
      icon: <List className="w-4 h-4" />,
    },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Agendamentos
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Gerencie todos os agendamentos
            </p>
          </div>

          {/* Google Calendar connect chip */}
          <button
            onClick={handleConnectGCal}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all ${gcalConnected ? "border-green-300 bg-green-50 text-green-700" : "border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"}`}
          >
            {gcalConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Google Agenda conectado
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19.5 3h-3V1.5h-9V3H4.5A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z"
                    fill="#4285F4"
                  />
                  <path d="M12 13.5a3 3 0 100-6 3 3 0 000 6z" fill="white" />
                  <path
                    d="M7.5 9H4.5v7.5h15V9H16.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Conectar Google Agenda
              </>
            )}
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar agendamentos..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors flex items-center gap-1.5 ${showFilters || selectedStatus ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {selectedStatus && (
              <span className="w-2 h-2 bg-brand-600 rounded-full" />
            )}
          </button>

          {/* View toggle — 4 options */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {viewButtons.map((btn, idx) => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${idx > 0 ? "border-l border-gray-300" : ""} ${view === btn.id ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {btn.icon}
                <span className="hidden sm:inline">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["", "Confirmado", "Pendente", "Cancelado"] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedStatus === s ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {s || "Todos"}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Day view ── */}
      {view === "day" && (
        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDayDate((d) => addDays(d, -1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setDayDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => setDayDate((d) => addDays(d, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-700 text-right">
              {dayLabel}
            </span>
            <button
              onClick={handleConnectGCal}
              className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar
            </button>
          </div>

          <TimeGrid
            days={[dayDate]}
            filteredAppointments={filteredAppointments}
            today={today}
            onCancel={setAppointmentToCancel}
            onGCal={handleAddToGCal}
            labels={[
              WEEK_DAYS_LONG[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1],
            ]}
          />
        </div>
      )}

      {/* ── Week view ── */}
      {view === "week" && (
        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setWeekStart(getMondayOf(new Date()))}
                className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {weekLabel}
            </span>
            <button
              onClick={handleConnectGCal}
              className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar
            </button>
          </div>

          <TimeGrid
            days={weekDays}
            filteredAppointments={filteredAppointments}
            today={today}
            onCancel={setAppointmentToCancel}
            onGCal={handleAddToGCal}
          />
        </div>
      )}

      {/* ── Month view ── */}
      {view === "month" && (
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-4 flex flex-col">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthViewDate((d) => addMonths(d, -1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setMonthViewDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => setMonthViewDate((d) => addMonths(d, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {monthLabel}
            </span>
            <button
              onClick={handleConnectGCal}
              className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div
              className="flex-1 grid grid-cols-7"
              style={{
                gridAutoRows: "minmax(90px, 1fr)",
              }}
            >
              {monthGrid.map((cell, i) => {
                if (!cell) {
                  return (
                    <div
                      key={i}
                      className="border-r border-b border-gray-100 last:border-r-0 bg-gray-50/50"
                    />
                  );
                }
                const dateStr = toDDMMYYYY(cell);
                const isToday = dateStr === today;
                const isOtherMonth =
                  cell.getMonth() !== monthViewDate.getMonth();
                const dayAppts = filteredAppointments.filter(
                  (a) => a.date === dateStr,
                );
                const visible = dayAppts.slice(0, 3);
                const overflow = dayAppts.length - visible.length;
                return (
                  <div
                    key={i}
                    onClick={() => handleMonthDayClick(cell)}
                    className={`border-r border-b border-gray-100 last:border-r-0 p-1.5 cursor-pointer transition-colors hover:bg-brand-50/40 flex flex-col gap-0.5 ${isOtherMonth ? "opacity-40" : ""}`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-end mb-0.5">
                      <span
                        className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        {cell.getDate()}
                      </span>
                    </div>

                    {/* Appointment chips */}
                    {visible.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium truncate leading-tight ${STATUS_STYLE[appt.status].chip}`}
                        title={`${appt.time} — ${appt.client}: ${appt.procedure}`}
                      >
                        {appt.time} {appt.client}
                      </div>
                    ))}

                    {overflow > 0 && (
                      <div className="text-xs text-gray-400 font-medium pl-1">
                        +{overflow} mais
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {appt.client}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[appt.status].badge}`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {appt.procedure}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {appt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {appt.time}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-gray-200 rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                          onSelect={() => handleAddToGCal(appt)}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Adicionar ao Google Agenda
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={appt.status === "Cancelado"}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
                          onSelect={() => setAppointmentToCancel(appt)}
                        >
                          <Ban className="w-4 h-4" />
                          Cancelar agendamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {copy("Procedimento")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Data
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Horário
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((appt) => (
                    <tr
                      key={appt.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-brand-600" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">
                            {appt.client}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {appt.procedure}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {appt.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {appt.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[appt.status].badge}`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                              onSelect={() => handleAddToGCal(appt)}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Adicionar ao Google Agenda
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={appt.status === "Cancelado"}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
                              onSelect={() => setAppointmentToCancel(appt)}
                            >
                              <Ban className="w-4 h-4" />
                              Cancelar agendamento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAppointments.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum agendamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Cancel dialog ── */}
      <AlertDialog
        open={!!appointmentToCancel}
        onOpenChange={(open) => {
          if (!open) setAppointmentToCancel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o agendamento de{" "}
              <strong>{appointmentToCancel?.client}</strong> para{" "}
              <strong>{appointmentToCancel?.procedure}</strong> em{" "}
              <strong>{appointmentToCancel?.date}</strong> às{" "}
              <strong>{appointmentToCancel?.time}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── New appointment modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Novo Agendamento
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              {/* Procedure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {copy("Procedimento *")}
                </label>
                <select
                  value={selProcedure}
                  onChange={(e) => setSelProcedure(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                >
                  <option value="">{copy("Selecione um procedimento")}</option>
                  {procedures
                    .filter((p) => p.status === "Ativo")
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.duration})
                      </option>
                    ))}
                </select>
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cliente *
                </label>
                <select
                  value={selClient}
                  onChange={(e) => setSelClient(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data *
                </label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() =>
                        setCalMonth(
                          new Date(
                            calMonth.getFullYear(),
                            calMonth.getMonth() - 1,
                          ),
                        )
                      }
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">
                      {MONTH_NAMES[calMonth.getMonth()]}{" "}
                      {calMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() =>
                        setCalMonth(
                          new Date(
                            calMonth.getFullYear(),
                            calMonth.getMonth() + 1,
                          ),
                        )
                      }
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (d) => (
                        <div
                          key={d}
                          className="text-center text-xs text-gray-400 py-1"
                        >
                          {d}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {getDaysInMonth(calMonth).map((day, i) => {
                      if (!day) return <div key={i} />;
                      const ds = `${String(day).padStart(2, "0")}/${String(calMonth.getMonth() + 1).padStart(2, "0")}/${calMonth.getFullYear()}`;
                      const isSel = selDate === ds;
                      const isT = ds === today;
                      return (
                        <button
                          key={i}
                          onClick={() => handleDayClick(day)}
                          className={`aspect-square text-sm font-medium rounded-lg transition-colors ${isSel ? "bg-brand-600 text-white" : isT ? "bg-brand-100 text-brand-700 hover:bg-brand-200" : "hover:bg-gray-100 text-gray-700"}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time slots */}
              {selDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Horário *{" "}
                    <span className="text-gray-400 font-normal">
                      — {selDate}
                    </span>
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                    {availableTimes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelTime(t)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${selTime === t ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={!selProcedure || !selClient || !selDate || !selTime}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Criar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
