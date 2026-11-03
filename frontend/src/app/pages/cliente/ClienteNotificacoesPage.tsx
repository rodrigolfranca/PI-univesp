import { useSite } from "../../config/SiteContext";
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";
type NotifType = "lembrete" | "confirmacao" | "cancelamento" | "info";
interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
const typeConfig: Record<
  NotifType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  lembrete: {
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  confirmacao: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  cancelamento: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
};
export function ClienteNotificacoesPage() {
  const MOCK_NOTIFICATIONS = useSite().data.clientNotifications;
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read);
  const read = MOCK_NOTIFICATIONS.filter((n) => n.read);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        {unread.length > 0 && (
          <span className="text-xs font-semibold text-white bg-brand-700 rounded-full px-2.5 py-1">
            {unread.length} nova{unread.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {MOCK_NOTIFICATIONS.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Sem notificações por enquanto.</p>
        </div>
      )}

      {unread.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Novas
          </h2>
          <div className="space-y-3">
            {unread.map((n) => (
              <NotifCard key={n.id} notification={n} />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Anteriores
          </h2>
          <div className="space-y-3">
            {read.map((n) => (
              <NotifCard key={n.id} notification={n} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
function NotifCard({ notification: n }: { notification: Notification }) {
  const cfg = typeConfig[n.type];
  const Icon = cfg.icon;
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 flex gap-4 ${n.read ? "border-gray-100 opacity-75" : "border-brand-300"}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
      >
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-medium text-sm ${n.read ? "text-gray-600" : "text-gray-900"}`}
          >
            {n.title}
          </p>
          {!n.read && (
            <span className="w-2 h-2 rounded-full bg-brand-700 flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
        <p className="text-xs text-gray-400 mt-1.5">{n.time}</p>
      </div>
    </div>
  );
}
