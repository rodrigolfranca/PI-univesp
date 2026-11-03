import { useSite } from "../config/SiteContext";
import {
  Bell,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
export function NotificationsPage() {
  const notifications = useSite().data.notifications;
  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return {
          icon: Calendar,
          color: "bg-blue-100 text-blue-600",
        };
      case "reminder":
        return {
          icon: Clock,
          color: "bg-yellow-100 text-yellow-600",
        };
      case "success":
        return {
          icon: CheckCircle,
          color: "bg-green-100 text-green-600",
        };
      case "alert":
        return {
          icon: AlertCircle,
          color: "bg-red-100 text-red-600",
        };
      default:
        return {
          icon: Bell,
          color: "bg-gray-100 text-gray-600",
        };
    }
  };
  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Notificações
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Acompanhe atualizações e alertas
          </p>
        </div>
        <button className="px-4 py-3 text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50 transition-colors text-sm md:text-base">
          Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap font-medium shadow-sm">
              Todas
            </button>
            <button className="px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap font-medium">
              Não lidas
            </button>
            <button className="px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap font-medium">
              Lidas
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => {
            const { icon: Icon, color } = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-brand-50/30" : ""}`}
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
                      {!notification.read && (
                        <span className="ml-2 w-2 h-2 bg-brand-600 rounded-full inline-block"></span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-500">
                      {notification.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
