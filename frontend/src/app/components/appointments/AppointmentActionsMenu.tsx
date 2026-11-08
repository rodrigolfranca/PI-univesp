import type { ReactElement } from "react";
import type { Appointment } from "../../config/types";
import { Ban, CalendarCheck, RefreshCw, UserPlus, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
export function AppointmentActionsMenu({
  appointment,
  onCancel,
  onGCal,
  onStatus,
  gcalConnected,
  canManage,
  trigger,
  contentClassName,
}: {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
  onGCal: (appointment: Appointment) => void;
  onStatus: (appointment: Appointment, status: "completed" | "absent") => void;
  gcalConnected: boolean;
  canManage: boolean;
  trigger: ReactElement;
  contentClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        {gcalConnected ? (
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
            onSelect={() => onGCal(appointment)}
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar com Google
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
            onSelect={() => onGCal(appointment)}
          >
            <UserPlus className="w-4 h-4" />
            Conectar Google Agenda
          </DropdownMenuItem>
        )}
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={appointment.status === "Concluído"}
              className="gap-2 cursor-pointer"
              onSelect={() => onStatus(appointment, "completed")}
            >
              <CalendarCheck className="w-4 h-4" />
              Marcar como concluído
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={appointment.status === "Ausente"}
              className="gap-2 cursor-pointer"
              onSelect={() => onStatus(appointment, "absent")}
            >
              <UserX className="w-4 h-4" />
              Marcar ausência
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={appointment.status === "Cancelado"}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
              onSelect={() => onCancel(appointment)}
            >
              <Ban className="w-4 h-4" />
              Cancelar agendamento
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
