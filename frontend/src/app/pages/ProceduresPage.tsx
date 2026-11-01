import { Search, Plus, Clock, DollarSign, Pencil, Trash2, SlidersHorizontal } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useProcedures } from "../context/ProceduresContext";
import { useCategories } from "../context/CategoriesContext";

type ProcedureForm = {
  name: string;
  category: string;
  duration: string;
  price: string;
  status: string;
  description: string;
};

const emptyForm: ProcedureForm = {
  name: "",
  category: "",
  duration: "",
  price: "",
  status: "Ativo",
  description: "",
};

export function ProceduresPage() {
  const { procedures, addProcedure, editProcedure, deleteProcedure } = useProcedures();
  const { categories } = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcedureForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<ProcedureForm>>({});

  const filteredProcedures = procedures.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleField(field: keyof ProcedureForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const newErrors: Partial<ProcedureForm> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!form.category) newErrors.category = "Categoria é obrigatória";
    if (!form.duration.trim()) newErrors.duration = "Duração é obrigatória";
    if (!form.price.trim()) newErrors.price = "Preço é obrigatório";
    return newErrors;
  }

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      duration: proc.duration,
      price: proc.price.replace("R$ ", ""),
      status: proc.status,
      description: proc.description,
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const data = {
      name: form.name,
      duration: form.duration,
      price: form.price.startsWith("R$") ? form.price : `R$ ${form.price}`,
      category: form.category,
      status: form.status,
      description: form.description,
    };
    if (editingId !== null) {
      editProcedure(editingId, data);
      toast.success("Procedimento atualizado com sucesso");
    } else {
      addProcedure(data);
      toast.success("Procedimento cadastrado com sucesso");
    }
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
    setEditingId(null);
  }

  function handleClose() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
    setEditingId(null);
  }

  function handleConfirmDelete() {
    if (deleteId === null) return;
    deleteProcedure(deleteId);
    toast.success("Procedimento excluído");
    setDeleteId(null);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Procedimentos</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Gerencie os procedimentos oferecidos</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar procedimentos..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${
                showFilters || selectedCategory
                  ? "border-wine-500 bg-wine-50 text-wine-700"
                  : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">Filtros</span>
              {selectedCategory && <span className="w-2 h-2 bg-wine-600 rounded-full" />}
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
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === ""
                          ? "bg-wine-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === cat.name
                            ? "bg-wine-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
          {filteredProcedures.map((procedure) => (
            <Link
              key={procedure.id}
              to={`/app/procedures/${procedure.id}`}
              className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md hover:border-wine-300 transition-all cursor-pointer relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg mb-2">{procedure.name}</h3>
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-wine-100 text-wine-700">
                    {procedure.category}
                  </span>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleOpenEdit(e, procedure.id)}
                    className="p-1.5 hover:bg-wine-50 hover:text-wine-600 rounded-lg transition-colors text-gray-400 opacity-0 group-hover:opacity-100"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(procedure.id); }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-gray-400 opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {procedure.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                  {procedure.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{procedure.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">{procedure.price}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  procedure.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {procedure.status}
                </span>
              </div>
            </Link>
          ))}

          {filteredProcedures.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <p className="text-sm">Nenhum procedimento encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-wine-600 text-white rounded-full shadow-lg hover:bg-wine-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir procedimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{procedures.find((p) => p.id === deleteId)?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Cadastro / Edição */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingId !== null ? "Editar Procedimento" : "Novo Procedimento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Procedimento <span className="text-wine-600">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="Ex: Limpeza de Pele"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50 ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria <span className="text-wine-600">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleField("category", cat.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      form.category === cat.name
                        ? "bg-wine-600 text-white border-wine-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>

            {/* Duração e Preço lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração <span className="text-wine-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => handleField("duration", e.target.value)}
                  placeholder="Ex: 60 min"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50 ${
                    errors.duration ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço <span className="text-wine-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => handleField("price", e.target.value)}
                    placeholder="0,00"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50 ${
                      errors.price ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                {["Ativo", "Inativo"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleField("status", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      form.status === s
                        ? s === "Ativo"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-gray-500 text-white border-gray-500"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder="Descreva o procedimento..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50 resize-none"
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
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-wine-600 text-white rounded-lg text-sm font-medium hover:bg-wine-700 transition-colors"
            >
              {editingId !== null ? "Salvar Alterações" : "Salvar Procedimento"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
