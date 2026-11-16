import { useEffect, useState } from "react";
import { Calendar, Clock, Download, FileText } from "lucide-react";
import { Link } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import type { Procedure } from "../config/types";
import { errorMessage } from "../services/api";
import { downloadPop, listPops } from "../services/pops";
import type { ApiPop } from "../services/pops";

interface ProcedureDetailDialogProps {
  procedure: Procedure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcedureDetailDialog({
  procedure,
  open,
  onOpenChange,
}: ProcedureDetailDialogProps) {
  const [pops, setPops] = useState<ApiPop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !procedure) return;

    const controller = new AbortController();
    setPops([]);
    setError("");
    setLoading(true);
    listPops(procedure.id, undefined, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPops(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, procedure]);

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

  if (!procedure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <span className="w-fit rounded bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
            {procedure.category}
          </span>
          <DialogTitle className="text-2xl text-brand-800">{procedure.name}</DialogTitle>
          <DialogDescription>
            {procedure.description || "Confira os detalhes do procedimento."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-5 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-600" />
                {procedure.duration}
              </span>
              <span className="font-semibold text-brand-700">{procedure.price}</span>
            </div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900">Documentos POP</h3>
              <p className="mt-1 text-sm text-gray-500">
                Procedimento Operacional Padrão disponível para consulta.
              </p>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Carregando documentos...</p>
                ) : error ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                ) : pops.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum POP disponível.</p>
                ) : (
                  pops.map((pop) => (
                    <div
                      key={pop.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 flex-shrink-0 text-brand-600" />
                        <span className="truncate text-sm text-gray-800">{pop.name}</span>
                      </div>
                      <button
                        type="button"
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

          <aside className="h-fit rounded-2xl border border-brand-100 bg-brand-50 p-5 md:self-start">
            <h3 className="text-lg font-semibold text-gray-900">Agende seu atendimento</h3>
            <p className="mt-2 text-sm text-gray-500">
              Consulte os horários disponíveis e escolha o profissional.
            </p>
            <Link
              to={`/login?treatmentId=${procedure.id}`}
              onClick={() => onOpenChange(false)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-3 font-medium text-white hover:bg-brand-600"
            >
              <Calendar className="h-4 w-4" />
              Agendar agora
            </Link>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
