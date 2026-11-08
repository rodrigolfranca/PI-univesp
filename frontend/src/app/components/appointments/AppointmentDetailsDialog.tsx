import { Calendar, Clock, ExternalLink, Phone, User } from "lucide-react";
import type { Appointment } from "../../config/types";
import { STATUS_STYLE } from "../../utils/appointments/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `https://wa.me/55${digits}`;
  if (digits.length >= 12) return `https://wa.me/${digits}`;
  return null;
}

export function AppointmentDetailsDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const link = appointment ? whatsappLink(appointment.clientPhone) : null;
  const styles = appointment ? STATUS_STYLE[appointment.status] : null;

  return (
    <Dialog open={Boolean(appointment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Detalhes do agendamento
          </DialogTitle>
        </DialogHeader>

        {appointment && styles && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">#{appointment.id}</span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
              >
                {appointment.status}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{appointment.client}</p>
                  <p className="text-sm text-gray-500">
                    {appointment.clientPhone || "Telefone não informado"}
                  </p>
                </div>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Profissional</p>
                  <p className="font-medium text-gray-900">{appointment.professional}</p>
                  {appointment.professionalPhone && (
                    <p className="text-sm text-gray-500">{appointment.professionalPhone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Procedimento</p>
                  <p className="font-medium text-gray-900">{appointment.procedure}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Data e horário</p>
                  <p className="font-medium text-gray-900">
                    {appointment.date} às {appointment.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
              <div>
                <p className="text-sm text-gray-500">Google Agenda</p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.googleEventLink ? "Evento sincronizado" : "Ainda não sincronizado"}
                </p>
              </div>
              {appointment.googleEventLink && (
                <a
                  href={appointment.googleEventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
