import { Outlet, Link, useLocation } from "react-router";
import { Users, Sparkles, Calendar, Bell, UserCircle } from "lucide-react";
import defaultLogo from "../../assets/brand/dayane-logo.png";
import { useBrand } from "../context/BrandContext";

export function RootLayout() {
  const location = useLocation();
  const { name, logoUrl } = useBrand();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/app/clients', icon: Users, label: 'Clientes' },
    { path: '/app/procedures', icon: Sparkles, label: 'Procedimentos' },
    { path: '/app/appointments', icon: Calendar, label: 'Agendamentos' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img
              src={logoUrl ?? defaultLogo}
              alt={name}
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-semibold text-wine-700">{name}</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-wine-100 text-wine-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Notifications and Settings */}
          <div className="flex items-center gap-4">
            <Link
              to="/app/notifications"
              className={`p-2 rounded-full transition-colors ${
                isActive('/app/notifications')
                  ? 'bg-wine-100 text-wine-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-6 h-6" />
            </Link>
            <Link
              to="/app/settings"
              className={`p-2 rounded-full transition-colors ${
                isActive('/app/settings')
                  ? 'bg-wine-100 text-wine-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCircle className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
        <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? 'text-wine-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
