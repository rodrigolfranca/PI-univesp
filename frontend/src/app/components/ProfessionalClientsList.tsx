import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { listMyClients, type ProfessionalClient } from "../services/schedules";
import { normalizePhone } from "../services/users";
import { RequestState } from "./RequestState";

export function ProfessionalClientsList() {
  const { token } = useAuth();
  const [clients, setClients] = useState<ProfessionalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listMyClients(token, controller.signal)
      .then(setClients)
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, reloadKey]);

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const digits = normalizePhone(query);
  const filtered = clients.filter(
    (client) =>
      !query ||
      client.name.toLocaleLowerCase("pt-BR").includes(query) ||
      (digits.length > 0 && client.phone_number.includes(digits)),
  );

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.currentTarget.value);
  }

  function reload() {
    setReloadKey((value) => value + 1);
  }

  if (loading || error) {
    return <RequestState loading={loading} error={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="professional-client-search" className="mb-1 block text-sm font-medium">
          Buscar clientes
        </label>
        <input
          id="professional-client-search"
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder="Nome ou telefone"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
        />
      </div>
      {!clients.length ? (
        <p className="rounded-xl border bg-white p-6">Você ainda não atendeu nenhum cliente.</p>
      ) : !filtered.length ? (
        <p className="rounded-xl border bg-white p-6">Nenhum resultado para esta busca.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden items-center gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_104px]">
            <span>Nome</span>
            <span>Telefone</span>
            <span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((client) => (
              <div
                key={client.clientId}
                className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_104px] md:gap-4 md:px-6"
                onClick={() => navigate(`/app/clients/${client.clientId}`)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100">
                      <UserRound className="h-4 w-4 text-brand-600" />
                    </span>
                    <Link
                      to={`/app/clients/${client.clientId}`}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Ver histórico de ${client.name}`}
                      className="min-w-0 truncate font-medium text-gray-900 transition-colors hover:text-brand-700"
                    >
                      {client.name}
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 md:hidden">{client.phone_number}</p>
                </div>
                <div className="hidden min-w-0 md:block">
                  <p className="text-gray-500">{client.phone_number}</p>
                </div>
                <div className="flex items-center justify-end">
                  <span className="p-2 text-gray-500">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
