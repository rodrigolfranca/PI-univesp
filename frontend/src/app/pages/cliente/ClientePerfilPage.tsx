import { useNavigate } from "react-router";
import { UserCircle, Phone, LogOut, ChevronRight, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
export function ClientePerfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate("/login");
  }
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center">
          <UserCircle className="w-16 h-16 text-brand-700" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {user?.name ?? "Cliente"}
          </p>
          <p className="text-sm text-gray-400">Conta de cliente</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <InfoRow icon={Phone} label="Telefone" value={user?.phone ?? "—"} />
        <InfoRow icon={Shield} label="Tipo de conta" value="Cliente" />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 transition-colors rounded-2xl group"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <span className="flex-1 font-medium text-red-500">Sair da conta</span>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Para alterar seus dados, entre em contato com a equipe.
      </p>
    </div>
  );
}
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-700" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
