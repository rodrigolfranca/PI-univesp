import { useEffect } from "react";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { GOOGLE_CALENDAR_RETURN_KEY, useGoogleCalendar } from "../context/GoogleCalendarContext";
import { errorMessage } from "../services/api";

export function GoogleCalendarSettings() {
  const { user } = useAuth();
  const { status, loading, error, connect, disconnect, reload } = useGoogleCalendar();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const result = searchParams.get("google");
    if (!result) return;

    if (result === "connected") {
      reload();
    }

    const next = new URLSearchParams(searchParams);
    next.delete("google");
    next.delete("message");
    setSearchParams(next, { replace: true });

    const returnTo = sessionStorage.getItem(GOOGLE_CALENDAR_RETURN_KEY);
    sessionStorage.removeItem(GOOGLE_CALENDAR_RETURN_KEY);
    const shouldReturn = Boolean(
      returnTo?.startsWith("/") && !returnTo.startsWith("//") && returnTo !== "/app/settings",
    );
    if (shouldReturn && returnTo) {
      navigate(returnTo, { replace: true });
    }

    const message = searchParams.get("message");
    window.setTimeout(
      () => {
        if (result === "connected") {
          toast.success("Agenda Google conectada");
        } else if (result === "error") {
          toast.error(message ?? "Falha ao conectar a agenda Google");
        }
      },
      shouldReturn ? 200 : 0,
    );
  }, [navigate, searchParams, setSearchParams, reload]);

  if (!user?.isAdmin) return null;

  async function handleConnect() {
    try {
      await connect();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Desconectar a agenda Google?")) return;
    try {
      await disconnect();
      toast.success("Agenda Google desconectada");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          {status?.connected ? (
            <CalendarCheck className="w-5 h-5 text-blue-600" />
          ) : (
            <CalendarX className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Google Agenda</h2>
          <p className="text-xs text-gray-500">
            {status?.connected
              ? "Os agendamentos são sincronizados automaticamente."
              : "Conecte para sincronizar os agendamentos automaticamente."}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {status?.connected ? (
          <>
            <button
              onClick={() => void handleDisconnect()}
              className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Desconectar
            </button>
            <button
              onClick={reload}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Atualizar status
            </button>
          </>
        ) : (
          <button
            onClick={() => void handleConnect()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-gray-300"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Conectar Google Agenda
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        A sincronização é feita no backend. Eventos são criados, atualizados e removidos quando o
        agendamento muda.
      </p>
    </div>
  );
}
