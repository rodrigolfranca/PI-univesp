import { Outlet, Link, useLocation } from "react-router";
import { Calendar, Bell, UserCircle } from "lucide-react";
import { NOTIFICATIONS_ENABLED } from "../config/features";
import { BrandLogo } from "./BrandLogo";
import { LogoutButton } from "./LogoutButton";
import { useBrand } from "../context/BrandContext";
import { useAuth } from "../context/AuthContext";

export function ClientLayout() {
  const location = useLocation();
  const { name } = useBrand();
  const { user } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/cliente/agendamentos" && location.pathname.startsWith(`${path}/`));

  const notificationItem = {
    path: "/cliente/notificacoes",
    icon: Bell,
    label: "Notificações",
  };
  const navItems = [
    { path: "/cliente/agendamentos", icon: Calendar, label: "Agendamentos" },
    ...(NOTIFICATIONS_ENABLED ? [notificationItem] : []),
    { path: "/cliente/perfil", icon: UserCircle, label: "Perfil" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="dashboard" />
            <div>
              <h1 className="text-base font-semibold text-brand-700 leading-tight">{name}</h1>
              {user?.name && <p className="text-xs text-gray-400">{user.name}</p>}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    active ? "bg-brand-100 text-brand-600" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 overflow-auto pt-16 pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-brand-600" : "text-gray-500"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
