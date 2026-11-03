import type { Appointment } from "../../config/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
export function CancelAppointmentDialog({
  appointment: appointmentToCancel,
  onClose,
  onConfirm: handleConfirmCancel,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={!!appointmentToCancel}
      onOpenChange={(open) => {
        if (!open) onClose();
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
  );
}
