import type { ReactNode } from "react";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  CalendarDays,
  LayoutGrid,
  Calendar as CalendarIcon,
  List,
} from "lucide-react";
import type { AppStatus } from "../../config/types";
import type { ViewMode } from "../../hooks/useAppointmentNavigation";
export function AppointmentsHeader({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedStatus,
  setSelectedStatus,
  view,
  setView,
  onConnectGCal,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  selectedStatus: AppStatus | "";
  setSelectedStatus: (value: AppStatus | "") => void;
  view: ViewMode;
  setView: (value: ViewMode) => void;
  onConnectGCal: () => void;
}) {
  const gcalConnected = false;
  const viewButtons: {
    id: ViewMode;
    label: string;
    icon: ReactNode;
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
    <div className="px-4 md:px-8 pt-6 pb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie todos os agendamentos</p>
        </div>

        <button
          onClick={onConnectGCal}
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

      <div className="flex items-center gap-2 flex-wrap">
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

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded-lg text-sm transition-colors flex items-center gap-1.5 ${showFilters || selectedStatus ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {selectedStatus && <span className="w-2 h-2 bg-brand-600 rounded-full" />}
        </button>

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

      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(["", "Confirmado", "Pendente", "Cancelado"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedStatus === s ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                {s || "Todos"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
