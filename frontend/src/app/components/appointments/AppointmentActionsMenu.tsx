import type { ReactElement } from "react";
import type { Appointment } from "../../config/types";
import { Ban, ExternalLink } from "lucide-react";
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
  trigger,
  contentClassName,
}: {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
  onGCal: (appointment: Appointment) => void;
  trigger: ReactElement;
  contentClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
          onSelect={() => onGCal(appointment)}
        >
          <ExternalLink className="w-4 h-4" />
          Adicionar ao Google Agenda
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={appointment.status === "Cancelado"}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer"
          onSelect={() => onCancel(appointment)}
        >
          <Ban className="w-4 h-4" />
          Cancelar agendamento
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
