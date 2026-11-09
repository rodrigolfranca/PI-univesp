import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { listMyClients, type ProfessionalClient } from "../services/schedules";
import { ClientHistory } from "./ClientHistory";
import { RequestState } from "./RequestState";

export function ProfessionalClientDetail({ clientId }: { clientId: number }) {
  const { token, professionalId } = useAuth();
  const [client, setClient] = useState<ProfessionalClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listMyClients(token, controller.signal)
      .then((clients) => {
        const found = clients.find((entry) => entry.clientId === clientId);
        if (!found) throw new Error("Cliente não encontrado entre seus atendimentos.");
        setClient(found);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [clientId, token, reloadKey]);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link to="/app/clients" className="text-brand-700 underline">
        ← Voltar para Clientes
      </Link>
      {loading || error ? (
        <RequestState loading={loading} error={error} onRetry={reload} />
      ) : client ? (
        <>
          <section className="rounded-xl border bg-white p-6">
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="mt-2 text-gray-600">Telefone: {client.phone_number}</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Histórico com você</h2>
            <ClientHistory clientId={client.clientId} professionalId={professionalId} />
          </section>
        </>
      ) : null}
    </div>
  );
}
