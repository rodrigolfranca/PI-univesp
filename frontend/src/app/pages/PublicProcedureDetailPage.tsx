import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, Download, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { BrandLogo } from "../components/BrandLogo";
import { errorMessage } from "../services/api";
import { getProcedure } from "../services/procedures";
import type { ApiProcedure } from "../services/procedures";
import { downloadPop, listPops } from "../services/pops";
import type { ApiPop } from "../services/pops";

export function PublicProcedureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [procedure, setProcedure] = useState<ApiProcedure | null>(null);
  const [pops, setPops] = useState<ApiPop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const procedureId = Number(id);
    if (!Number.isInteger(procedureId) || procedureId < 1) {
      setError("Procedimento não encontrado.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      getProcedure(procedureId, controller.signal),
      listPops(procedureId, undefined, controller.signal),
    ])
      .then(([procedureResult, popResult]) => {
        if (controller.signal.aborted) return;
        setProcedure(procedureResult);
        setPops(popResult);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  async function handleDownload(pop: ApiPop) {
    try {
      const { blob, filename } = await downloadPop(pop.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename ?? `${pop.name}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <header className="bg-white/95 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/tratamentos")}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <BrandLogo size="small" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <p className="text-gray-500">Carregando procedimento...</p>
        ) : error || !procedure ? (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">
            {error || "Procedimento não encontrado."}
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-md">
                <span className="inline-block rounded bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                  {procedure.category?.name ?? "Geral"}
                </span>
                <h1 className="mt-3 text-3xl font-bold text-brand-800">{procedure.name}</h1>
                {procedure.description && (
                  <p className="mt-3 leading-relaxed text-gray-600">{procedure.description}</p>
                )}
                <div className="mt-5 flex flex-wrap gap-5 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-brand-600" />
                    {procedure.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-brand-700">
                    R$ {procedure.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-900">Documentos POP</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Procedimento Operacional Padrão disponível para consulta.
                </p>
                <div className="mt-4 space-y-3">
                  {pops.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum POP disponível.</p>
                  ) : (
                    pops.map((pop) => (
                      <div
                        key={pop.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 flex-shrink-0 text-brand-600" />
                          <span className="truncate text-sm text-gray-800">{pop.name}</span>
                        </div>
                        <button
                          onClick={() => void handleDownload(pop)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                        >
                          <Download className="h-4 w-4" />
                          Baixar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-brand-100 bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-900">Agende seu atendimento</h2>
              <p className="mt-2 text-sm text-gray-500">
                Consulte os horários disponíveis e escolha o profissional.
              </p>
              <button
                onClick={() => navigate(`/agendar/${procedure.id}`)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-3 font-medium text-white hover:bg-brand-600"
              >
                <Calendar className="h-4 w-4" />
                Agendar agora
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
