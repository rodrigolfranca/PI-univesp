import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <button
      type="button"
      aria-label="Sair"
      onClick={handleLogout}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
