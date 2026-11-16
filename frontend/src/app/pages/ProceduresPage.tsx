import { useTerminology } from "../config/SiteContext";
import {
  Search,
  Plus,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Switch } from "../components/ui/switch";
import { useProcedures } from "../context/ProceduresContext";
import { useCategories } from "../context/CategoriesContext";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import type { Procedure } from "../config/types";
import { errorMessage } from "../services/api";

type ProcedureForm = {
  name: string;
  category: string;
  professionalIds: number[];
  duration: string;
  price: string;
  status: string;
  description: string;
  sessions: string;
  triagem: boolean;
  triagemMinutes: string;
  bloqueioPeriodo: string;
};

type ProcedureFormErrors = Partial<Record<keyof ProcedureForm, string>>;

const emptyForm: ProcedureForm = {
  name: "",
  category: "",
  professionalIds: [],
  duration: "",
  price: "",
  status: "Ativo",
  description: "",
  sessions: "1",
  triagem: false,
  triagemMinutes: "0",
  bloqueioPeriodo: "",
};

export function ProceduresPage() {
  const copy = useTerminology();
  const {
    procedures,
    loading,
    error,
    addProcedure,
    editProcedure,
    setProcedureStatus,
    deleteProcedure,
  } = useProcedures();
  const { categories } = useCategories();
  const { user } = useAuth();
  const { users } = useUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcedureForm>(emptyForm);
  const [errors, setErrors] = useState<ProcedureFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(() => new Set());
  const professionals = users
    .filter((entry) => entry.professional)
    .map((entry) => ({ id: entry.professional!.id, name: entry.name }));
  const visibleProcedures = user?.isAdmin
    ? procedures
    : procedures.filter(
        (procedure) =>
          user?.professionalId &&
          procedure.professionals.some((professional) => professional.id === user.professionalId),
      );
  const filteredProcedures = visibleProcedures.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesProfessional =
      !selectedProfessionalId ||
      p.professionals.some((professional) => professional.id === Number(selectedProfessionalId));
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesProfessional && matchesSearch;
  });

  function handleField(field: keyof ProcedureForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field])
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
  }

  function toggleProfessional(id: number) {
    setForm((prev) => ({
      ...prev,
      professionalIds: prev.professionalIds.includes(id)
        ? prev.professionalIds.filter((professionalId) => professionalId !== id)
        : [...prev.professionalIds, id],
    }));
    if (errors.professionalIds)
      setErrors((prev) => ({
        ...prev,
        professionalIds: "",
      }));
  }

  function validate() {
    const newErrors: ProcedureFormErrors = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";

    if (!form.category) newErrors.category = "Categoria é obrigatória";
    if (form.professionalIds.length === 0)
      newErrors.professionalIds = "Selecione pelo menos um profissional";

    if (!form.duration.trim()) newErrors.duration = "Duração é obrigatória";

    if (!form.price.trim()) newErrors.price = "Preço é obrigatório";

    return newErrors;
  }

  function handleOpenCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
    setModalOpen(true);
  }

  function handleOpenEdit(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    const proc = procedures.find((p) => p.id === id);
    if (!proc) return;

    setEditingId(id);
    setForm({
      name: proc.name,
      category: proc.category,
      professionalIds: proc.professionals.map((professional) => professional.id),
      duration: proc.duration,
      price: proc.price.replace("R$ ", ""),
      status: proc.status,
      description: proc.description,
      sessions: String(proc.sessions),
      triagem: proc.triagem,
      triagemMinutes: String(proc.triagemMinutes),
      bloqueioPeriodo: proc.bloqueioPeriodo === null ? "" : String(proc.bloqueioPeriodo),
    });
    setErrors({});
    setModalOpen(true);
  }

  async function handleToggleStatus(procedure: Procedure, active: boolean) {
    if (togglingIds.has(procedure.id)) return;

    setTogglingIds((current) => new Set(current).add(procedure.id));
    try {
      await setProcedureStatus(procedure.id, active);
      toast.success(active ? "Procedimento ativado" : "Procedimento desativado");
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setTogglingIds((current) => {
        const next = new Set(current);
        next.delete(procedure.id);
        return next;
      });
    }
  }

  async function handleSubmit() {
    const newErrors = validate();
    const durationMinutes = Number.parseInt(form.duration.replace(/\D/g, ""), 10);
    const priceValue = Number.parseFloat(form.price.replace(/[^\d,.-]/g, "").replace(",", "."));
    const sessions = Number.parseInt(form.sessions, 10);
    const triagemMinutes = Number.parseInt(form.triagemMinutes || "0", 10);
    const bloqueioPeriodo = form.bloqueioPeriodo.trim()
      ? Number.parseInt(form.bloqueioPeriodo, 10)
      : null;

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      newErrors.duration = "Informe a duração em minutos";
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      newErrors.price = "Informe um preço válido";
    }
    if (!Number.isInteger(sessions) || sessions < 1) {
      newErrors.sessions = "Informe pelo menos uma sessão";
    }
    if (form.triagem && (!Number.isInteger(triagemMinutes) || triagemMinutes < 0)) {
      newErrors.triagemMinutes = "Informe a duração da triagem";
    }
    if (bloqueioPeriodo !== null && (!Number.isInteger(bloqueioPeriodo) || bloqueioPeriodo < 0)) {
      newErrors.bloqueioPeriodo = "Informe um período válido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name,
        category: form.category,
        professionalIds: form.professionalIds,
        status: form.status,
        description: form.description,
        durationMinutes,
        priceValue,
        sessions,
        triagem: form.triagem,
        triagemMinutes: form.triagem ? triagemMinutes : 0,
        bloqueioPeriodo,
      };
      if (editingId !== null) {
        await editProcedure(editingId, data);
        toast.success(copy("Procedimento atualizado com sucesso"));
      } else {
        await addProcedure(data);
        toast.success(copy("Procedimento cadastrado com sucesso"));
      }

      setForm(emptyForm);
      setErrors({});
      setModalOpen(false);
      setEditingId(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
    setEditingId(null);
  }

  async function handleConfirmDelete() {
    if (deleteId === null) return;

    try {
      await deleteProcedure(deleteId);
      toast.success(copy("Procedimento excluído"));
      setDeleteId(null);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          {copy("Procedimentos")}
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          {copy("Gerencie os procedimentos oferecidos")}
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy("Buscar procedimentos...")}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${showFilters || selectedCategory || selectedProfessionalId ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">Filtros</span>
              {(selectedCategory || selectedProfessionalId) && (
                <span className="w-2 h-2 bg-brand-600 rounded-full" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("")}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedCategory === "" ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.name ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                {user?.isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissional
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedProfessionalId("")}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedProfessionalId === "" ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        Todos
                      </button>
                      {professionals.map((professional) => (
                        <button
                          key={professional.id}
                          onClick={() => setSelectedProfessionalId(String(professional.id))}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedProfessionalId === String(professional.id) ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                        >
                          {professional.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
          {filteredProcedures.map((procedure) => {
            const isActive = procedure.status === "Ativo";
            const isToggling = togglingIds.has(procedure.id);
            const actionLabel = isToggling
              ? isActive
                ? "Desativando..."
                : "Ativando..."
              : isActive
                ? "Desativar"
                : "Ativar";

            return (
              <div
                key={procedure.id}
                className="group relative rounded-lg border border-gray-200 transition-all hover:border-brand-300 hover:shadow-md"
              >
                <Link
                  to={`/app/procedures/${procedure.id}`}
                  aria-label={`Abrir ${procedure.name}`}
                  className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                />
                <div className="pointer-events-none relative z-10 p-4 md:p-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 text-base font-semibold text-gray-900 md:text-lg">
                        {procedure.name}
                      </h3>
                      <span className="inline-flex rounded bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
                        {procedure.category}
                      </span>
                    </div>
                    {user?.isAdmin && (
                      <div className="pointer-events-auto ml-2 flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(e, procedure.id)}
                          className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-colors hover:bg-brand-50 hover:text-brand-600 group-hover:opacity-100 focus:opacity-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteId(procedure.id);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {procedure.description && (
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {procedure.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{procedure.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-900">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{procedure.price}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        Profissionais
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {procedure.professionals.length === 0 ? (
                          <span className="text-xs text-gray-500">
                            Nenhum profissional vinculado
                          </span>
                        ) : (
                          procedure.professionals.map((professional) => (
                            <span
                              key={professional.id}
                              className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
                            >
                              {professional.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {procedure.status}
                      </span>
                      {user?.isAdmin && (
                        <div className="pointer-events-auto flex items-center gap-2">
                          <label
                            htmlFor={`procedure-status-${procedure.id}`}
                            className="cursor-pointer select-none text-xs font-medium text-gray-600"
                          >
                            {actionLabel}
                          </label>
                          <Switch
                            id={`procedure-status-${procedure.id}`}
                            checked={isActive}
                            disabled={isToggling}
                            aria-busy={isToggling}
                            onCheckedChange={(checked) =>
                              void handleToggleStatus(procedure, checked)
                            }
                            aria-label={
                              isActive ? `Desativar ${procedure.name}` : `Ativar ${procedure.name}`
                            }
                            title={isActive ? "Desativar procedimento" : "Ativar procedimento"}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProcedures.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <p className="text-sm">
                {loading
                  ? "Carregando procedimentos..."
                  : !user?.isAdmin && visibleProcedures.length === 0
                    ? "Nenhum procedimento habilitado para você."
                    : copy("Nenhum procedimento encontrado")}
              </p>
            </div>
          )}
        </div>
      </div>

      {user?.isAdmin && (
        <button
          onClick={handleOpenCreate}
          aria-label="Novo procedimento"
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy("Excluir procedimento")}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{procedures.find((p) => p.id === deleteId)?.name}</strong>? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingId !== null ? copy("Editar Procedimento") : copy("Novo Procedimento")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {copy(" Nome do Procedimento ")}
                <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="Ex: Atendimento"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
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
                    onClick={() => handleField("category", cat.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${form.category === cat.name ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profissionais habilitados <span className="text-brand-600">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {professionals.map((professional) => {
                  const selected = form.professionalIds.includes(professional.id);
                  return (
                    <button
                      key={professional.id}
                      type="button"
                      onClick={() => toggleProfessional(professional.id)}
                      aria-pressed={selected}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selected ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      {professional.name}
                    </button>
                  );
                })}
              </div>
              {professionals.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Cadastre um profissional antes de criar procedimentos.
                </p>
              )}
              {errors.professionalIds && (
                <p className="mt-1 text-xs text-red-500">{errors.professionalIds}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => handleField("duration", e.target.value)}
                  placeholder="Ex: 60 min"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.duration ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
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
                    value={form.price}
                    onChange={(e) => handleField("price", e.target.value)}
                    placeholder="0,00"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.price ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                {["Ativo", "Inativo"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleField("status", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${form.status === s ? (s === "Ativo" ? "bg-green-600 text-white border-green-600" : "bg-gray-500 text-white border-gray-500") : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder={copy("Descreva o procedimento...")}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving
                ? "Salvando..."
                : editingId !== null
                  ? "Salvar Alterações"
                  : copy("Salvar Procedimento")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
