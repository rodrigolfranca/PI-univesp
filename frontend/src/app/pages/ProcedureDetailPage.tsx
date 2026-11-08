import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useProcedures } from "../context/ProceduresContext";
import type { ProcedureFormData } from "../context/ProceduresContext";
import { useCategories } from "../context/CategoriesContext";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import * as popsService from "../services/pops";
import type { ApiPop } from "../services/pops";
import { useTerminology } from "../config/SiteContext";

type ProcedureForm = {
  name: string;
  category: string;
  duration: string;
  price: string;
  status: string;
  description: string;
};

export function ProcedureDetailPage() {
  const copy = useTerminology();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { procedures, loading, error, editProcedure } = useProcedures();
  const { categories } = useCategories();
  const procedure = procedures.find((entry) => entry.id === Number(id));
  const [pops, setPops] = useState<ApiPop[]>([]);
  const [popsLoading, setPopsLoading] = useState(false);
  const [popsError, setPopsError] = useState("");
  const [showAddPOP, setShowAddPOP] = useState(false);
  const [popName, setPopName] = useState("");
  const [popFile, setPopFile] = useState<File | null>(null);
  const [popSaving, setPopSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<ProcedureForm>({
    name: "",
    category: "",
    duration: "",
    price: "",
    status: "Ativo",
    description: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<ProcedureForm>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!procedure || !token) {
      setPops([]);
      return;
    }

    const controller = new AbortController();
    setPopsLoading(true);
    setPopsError("");
    popsService
      .listPops(procedure.id, token, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPops(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setPopsError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setPopsLoading(false);
      });
    return () => controller.abort();
  }, [procedure, token]);

  if (loading && !procedure) {
    return <p className="p-4 text-gray-500 md:p-8">Carregando procedimento...</p>;
  }

  if (!procedure) {
    return (
      <div className="p-4 md:p-8">
        <button
          onClick={() => navigate("/app/procedures")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{copy("Voltar para Procedimentos")}</span>
        </button>
        <p className="text-gray-500">{error || copy("Procedimento não encontrado.")}</p>
      </div>
    );
  }

  function openEdit() {
    setEditForm({
      name: procedure!.name,
      category: procedure!.category,
      duration: procedure!.duration,
      price: procedure!.price.replace("R$ ", ""),
      status: procedure!.status,
      description: procedure!.description,
    });
    setEditErrors({});
    setEditOpen(true);
  }

  function handleEditField(field: keyof ProcedureForm, value: string) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (editErrors[field])
      setEditErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
  }

  async function handleEditSubmit() {
    const newErrors: Partial<ProcedureForm> = {};
    if (!editForm.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!editForm.category) newErrors.category = "Categoria é obrigatória";
    if (!editForm.duration.trim()) newErrors.duration = "Duração é obrigatória";
    if (!editForm.price.trim()) newErrors.price = "Preço é obrigatório";

    const durationMinutes = Number.parseInt(editForm.duration.replace(/\D/g, ""), 10);
    const priceValue = Number.parseFloat(editForm.price.replace(/[^\d,.-]/g, "").replace(",", "."));
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      newErrors.duration = "Informe a duração em minutos";
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      newErrors.price = "Informe um preço válido";
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    const payload: ProcedureFormData = {
      name: editForm.name,
      category: editForm.category,
      status: editForm.status,
      description: editForm.description,
      durationMinutes,
      priceValue,
      sessions: procedure!.sessions,
      triagem: procedure!.triagem,
      triagemMinutes: procedure!.triagemMinutes,
      bloqueioPeriodo: procedure!.bloqueioPeriodo,
    };

    setEditSaving(true);
    try {
      await editProcedure(procedure!.id, payload);
      toast.success(copy("Procedimento atualizado com sucesso"));
      setEditOpen(false);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAddPOP() {
    if (!token) return;
    if (!popFile) {
      setPopsError("Selecione um arquivo PDF.");
      return;
    }
    if (popFile.size > 4.5 * 1024 * 1024) {
      setPopsError("O PDF deve ter no máximo 4,5 MB.");
      return;
    }

    setPopSaving(true);
    setPopsError("");
    try {
      const created = await popsService.createPop(
        {
          procedureId: procedure!.id,
          name: popName.trim() || popFile.name,
          file: popFile,
        },
        token,
      );
      setPops((current) => [created, ...current]);
      setShowAddPOP(false);
      setPopName("");
      setPopFile(null);
      toast.success("Documento POP adicionado");
    } catch (cause) {
      setPopsError(errorMessage(cause));
    } finally {
      setPopSaving(false);
    }
  }

  async function handleDownloadPOP(pop: ApiPop) {
    if (!token) return;
    try {
      const { blob, filename } = await popsService.downloadPop(pop.id, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename ?? `${pop.name}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleDeletePOP(pop: ApiPop) {
    if (!token) return;
    if (!window.confirm(`Excluir o documento "${pop.name}"?`)) return;
    try {
      await popsService.deletePop(pop.id, token);
      setPops((current) => current.filter((entry) => entry.id !== pop.id));
      toast.success("Documento POP excluído");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/app/procedures")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{copy("Voltar para Procedimentos")}</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{procedure.name}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">{procedure.category}</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Informações Gerais
            </h2>
            <div className="space-y-4">
              {procedure.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Descrição</h3>
                  <p className="text-gray-600">{procedure.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duração
                  </h3>
                  <p className="text-gray-600">{procedure.duration}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Valor
                  </h3>
                  <p className="text-gray-600">{procedure.price}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Status</h3>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${procedure.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {procedure.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Documentos POP</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {copy("Procedimento Operacional Padrão")}
                </p>
              </div>
              {user?.isAdmin && (
                <button
                  onClick={() => setShowAddPOP(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm md:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Adicionar</span>
                </button>
              )}
            </div>

            {popsError && (
              <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {popsError}
              </p>
            )}

            <div className="space-y-3">
              {popsLoading ? (
                <p className="py-8 text-center text-gray-500">Carregando documentos...</p>
              ) : pops.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum documento POP cadastrado</p>
                </div>
              ) : (
                pops.map((pop) => (
                  <div
                    key={pop.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{pop.name}</h3>
                        <p className="text-sm text-gray-500">
                          {pop.created_at
                            ? new Date(pop.created_at).toLocaleDateString("pt-BR")
                            : "PDF"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => void handleDownloadPOP(pop)}
                        className="p-2 text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Baixar PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      {user?.isAdmin && (
                        <button
                          onClick={() => void handleDeletePOP(pop)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              {user?.isAdmin && (
                <button
                  onClick={openEdit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-medium"
                >
                  {copy(" Editar Procedimento ")}
                </button>
              )}
              <button
                onClick={() => navigate(`/agendar/${procedure.id}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
              >
                {copy(" Agendar Procedimento ")}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Documentos POP</p>
                <p className="text-2xl font-bold text-gray-900">{pops.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddPOP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Adicionar Documento POP</h3>
              <button
                onClick={() => setShowAddPOP(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do Documento
                </label>
                <input
                  type="text"
                  value={popName}
                  onChange={(event) => setPopName(event.target.value)}
                  placeholder="Ex: Instruções do serviço.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Arquivo</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-600 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {popFile ? popFile.name : "Clique para selecionar o PDF"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Somente PDF até 4,5 MB</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => setPopFile(event.target.files?.[0] ?? null)}
                />
              </div>
              {popsError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {popsError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddPOP(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleAddPOP()}
                  disabled={popSaving || !popFile}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {popSaving ? "Enviando..." : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {copy("Editar Procedimento")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleEditField("name", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 ${editErrors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {editErrors.name && <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria <span className="text-brand-600">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleEditField("category", cat.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${editForm.category === cat.name ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {editErrors.category && (
                <p className="mt-1 text-xs text-red-500">{editErrors.category}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.duration}
                  onChange={(e) => handleEditField("duration", e.target.value)}
                  placeholder="Ex: 60 min"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 ${editErrors.duration ? "border-red-400" : "border-gray-300"}`}
                />
                {editErrors.duration && (
                  <p className="mt-1 text-xs text-red-500">{editErrors.duration}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço <span className="text-brand-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    value={editForm.price}
                    onChange={(e) => handleEditField("price", e.target.value)}
                    placeholder="0,00"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 ${editErrors.price ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
                {editErrors.price && (
                  <p className="mt-1 text-xs text-red-500">{editErrors.price}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                {["Ativo", "Inativo"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleEditField("status", status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${editForm.status === status ? (status === "Ativo" ? "bg-green-600 text-white border-green-600" : "bg-gray-500 text-white border-gray-500") : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => handleEditField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={editSaving}
              onClick={() => void handleEditSubmit()}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
