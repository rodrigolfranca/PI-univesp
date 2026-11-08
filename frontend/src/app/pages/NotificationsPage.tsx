import { useSite, useStorageKey } from "../config/SiteContext";
import { Bell, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

type NotificationFilter = "all" | "unread" | "read";

export function NotificationsPage() {
  const notifications = useSite().data.notifications;
  const storageKey = useStorageKey("notifications_read_v1");
  const [readIds, setReadIds] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [filter, setFilter] = useState<NotificationFilter>("all");

  function isRead(id: number, original: boolean) {
    return readIds[String(id)] ?? original;
  }

  function persist(next: Record<string, boolean>) {
    setReadIds(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function markRead(id: number) {
    persist({ ...readIds, [String(id)]: true });
  }

  function markAllRead() {
    const next = { ...readIds };
    notifications.forEach((notification) => {
      next[String(notification.id)] = true;
    });
    persist(next);
  }

  const displayed = notifications.filter((notification) => {
    const read = isRead(notification.id, notification.read);
    if (filter === "unread") return !read;
    if (filter === "read") return read;
    return true;
  });
  const unreadCount = notifications.filter(
    (notification) => !isRead(notification.id, notification.read),
  ).length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Notificações</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Acompanhe atualizações e alertas
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="px-4 py-3 text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50 transition-colors text-sm md:text-base disabled:cursor-not-allowed disabled:opacity-50"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex overflow-x-auto gap-2">
            {[
              { id: "all", label: "Todas" },
              { id: "unread", label: `Não lidas (${unreadCount})` },
              { id: "read", label: "Lidas" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as NotificationFilter)}
                className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  filter === item.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {displayed.map((notification) => {
            const { icon: Icon, color } = getIcon(notification.type);
            const read = isRead(notification.id, notification.read);

            return (
              <div
                key={notification.id}
                onClick={() => markRead(notification.id)}
                className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !read ? "bg-brand-50/30" : ""
                }`}
              >
                <div className="flex gap-3 md:gap-4">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                      {notification.title}
                      {!read && (
                        <span className="ml-2 w-2 h-2 bg-brand-600 rounded-full inline-block"></span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {displayed.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              Nenhuma notificação neste filtro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "appointment":
      return { icon: Calendar, color: "bg-blue-100 text-blue-600" };
    case "reminder":
      return { icon: Clock, color: "bg-yellow-100 text-yellow-600" };
    case "success":
      return { icon: CheckCircle, color: "bg-green-100 text-green-600" };
    case "alert":
      return { icon: AlertCircle, color: "bg-red-100 text-red-600" };
    default:
      return { icon: Bell, color: "bg-gray-100 text-gray-600" };
  }
}
