import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router";
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Seus clientes</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-4">
                  Nome
                </th>
                <th scope="col" className="p-4">
                  Telefone
                </th>
                <th scope="col" className="p-4">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((client) => (
                <tr key={client.clientId}>
                  <td className="p-4 font-medium">{client.name}</td>
                  <td className="p-4">{client.phone_number}</td>
                  <td className="p-4">
                    <Link
                      to={`/app/clients/${client.clientId}`}
                      className="text-brand-700 underline"
                      aria-label={`Ver histórico de ${client.name}`}
                    >
                      Ver histórico
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
