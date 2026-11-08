import { useTerminology } from "../../config/SiteContext";
import type { Appointment } from "../../config/types";
import { STATUS_STYLE } from "../../utils/appointments/constants";
import { AppointmentActionsMenu } from "./AppointmentActionsMenu";
import { User, Calendar as CalendarIcon, Clock, MoreVertical } from "lucide-react";
export function AppointmentsListView({
  appointments: filteredAppointments,
  onCancel,
  onGCal,
}: {
  appointments: Appointment[];
  onCancel: (appointment: Appointment) => void;
  onGCal: (appointment: Appointment) => void;
}) {
  const copy = useTerminology();
  return (
    <div className="flex-1 overflow-auto px-4 md:px-8 pb-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {filteredAppointments.map((appt) => (
            <div key={appt.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{appt.client}</h3>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[appt.status].badge}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{appt.procedure}</p>
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
                <AppointmentActionsMenu
                  appointment={appt}
                  onCancel={onCancel}
                  onGCal={onGCal}
                  trigger={
                    <button
                      aria-label="Ações do agendamento"
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  }
                />
              </div>
            </div>
          ))}
        </div>

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
                <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{appt.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{appt.procedure}</td>
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
                    <AppointmentActionsMenu
                      appointment={appt}
                      onCancel={onCancel}
                      onGCal={onGCal}
                      trigger={
                        <button
                          aria-label="Ações do agendamento"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      }
                    />
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
  );
}
