import { useSite, useStorageKey } from "../../config/SiteContext";
import { Bell, Calendar, CheckCircle, XCircle, Info } from "lucide-react";
import { useState } from "react";

type NotifType = "lembrete" | "confirmacao" | "cancelamento" | "info";
type NotificationFilter = "all" | "unread" | "read";

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
  lembrete: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  confirmacao: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  cancelamento: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
};

export function ClienteNotificacoesPage() {
  const notifications = useSite().data.clientNotifications as Notification[];
  const storageKey = useStorageKey("client_notifications_read_v1");
  const [readIds, setReadIds] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [filter, setFilter] = useState<NotificationFilter>("all");

  function isRead(notification: Notification) {
    return readIds[notification.id] ?? notification.read;
  }

  function persist(next: Record<string, boolean>) {
    setReadIds(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function markRead(id: string) {
    persist({ ...readIds, [id]: true });
  }

  function markAllRead() {
    const next = { ...readIds };
    notifications.forEach((notification) => {
      next[notification.id] = true;
    });
    persist(next);
  }

  const displayed = notifications.filter((notification) => {
    const read = isRead(notification);
    if (filter === "unread") return !read;
    if (filter === "read") return read;
    return true;
  });
  const unreadCount = notifications.filter((notification) => !isRead(notification)).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Dados de demonstração. Esta seção ainda não foi integrada à sua conta.
      </p>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "all", label: "Todas" },
          { id: "unread", label: "Não lidas" },
          { id: "read", label: "Lidas" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as NotificationFilter)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === item.id
                ? "bg-brand-700 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Sem notificações neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((notification) => (
            <NotifCard
              key={notification.id}
              notification={notification}
              read={isRead(notification)}
              onRead={() => markRead(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotifCard({
  notification,
  read,
  onRead,
}: {
  notification: Notification;
  read: boolean;
  onRead: () => void;
}) {
  const cfg = typeConfig[notification.type];
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      onClick={onRead}
      className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 flex gap-4 ${
        read ? "border-gray-100 opacity-75" : "border-brand-300"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
      >
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm ${read ? "text-gray-600" : "text-gray-900"}`}>
            {notification.title}
          </p>
          {!read && <span className="w-2 h-2 rounded-full bg-brand-700 flex-shrink-0 mt-1" />}
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1.5">{notification.time}</p>
      </div>
    </button>
  );
}
