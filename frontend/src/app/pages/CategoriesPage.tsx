import { useTerminology } from "../config/SiteContext";
import { useState } from "react";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, Tag, ChevronRight } from "lucide-react";
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
import { useCategories } from "../context/CategoriesContext";
import { useProcedures } from "../context/ProceduresContext";
export function CategoriesPage() {
  const copy = useTerminology();
  const { categories, addCategory, editCategory, deleteCategory } =
    useCategories();
  const { procedures } = useProcedures();
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  function procedureCount(categoryName: string) {
    return procedures.filter((p) => p.category === categoryName).length;
  }
  function handleAdd() {
    const trimmed = addName.trim();
    if (!trimmed) {
      setAddError("Nome é obrigatório");
      return;
    }
    if (
      categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setAddError("Já existe uma categoria com este nome");
      return;
    }
    addCategory(trimmed);
    toast.success(`Categoria "${trimmed}" criada`);
    setAddName("");
    setAddError("");
    setAddOpen(false);
  }
  function openEdit(id: number, name: string) {
    setEditId(id);
    setEditName(name);
    setEditError("");
    setEditOpen(true);
  }
  function handleEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Nome é obrigatório");
      return;
    }
    if (
      categories.some(
        (c) =>
          c.id !== editId && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setEditError("Já existe uma categoria com este nome");
      return;
    }
    editCategory(editId!, trimmed);
    toast.success("Categoria atualizada");
    setEditOpen(false);
  }
  function openDelete(id: number) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const count = procedureCount(cat.name);
    if (count > 0) {
      toast.error(
        "" +
          '"' +
          cat.name +
          '" está vinculada a ' +
          count +
          copy(" procedimento") +
          (count > 1 ? "s" : "") +
          copy(". Remova os procedimentos antes."),
      );
      return;
    }
    setDeleteId(id);
    setDeleteOpen(true);
  }
  function handleDelete() {
    deleteCategory(deleteId!);
    toast.success("Categoria removida");
    setDeleteOpen(false);
  }
  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <Link
          to="/app/settings"
          className="hover:text-brand-600 transition-colors"
        >
          Configurações
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Categorias</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          {copy(" Categorias de Procedimentos ")}
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          {copy(" Organize os procedimentos por categoria ")}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header row */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {categories.length} categori{categories.length === 1 ? "a" : "as"}
          </span>
          <button
            onClick={() => {
              setAddName("");
              setAddError("");
              setAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova categoria
          </button>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {categories.map((cat) => {
            const count = procedureCount(cat.name);
            return (
              <div key={cat.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {count}
                    {copy(" procedimento")}
                    {count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(cat.id, cat.name)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-brand-600"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDelete(cat.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma categoria cadastrada.
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Categoria
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {copy(" Procedimentos ")}
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => {
                const count = procedureCount(cat.name);
                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-4 h-4 text-brand-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${count > 0 ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {count}
                        {copy(" procedimento")}
                        {count !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat.id, cat.name)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-brand-600"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(cat.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={() => {
          setAddName("");
          setAddError("");
          setAddOpen(true);
        }}
        className="fixed bottom-24 right-4 md:hidden w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Dialog: Adicionar */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => !open && setAddOpen(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Nova Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              value={addName}
              onChange={(e) => {
                setAddName(e.target.value);
                if (addError) setAddError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ex: Capilares"
              autoFocus
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${addError ? "border-red-400" : "border-gray-300"}`}
            />
            {addError && (
              <p className="mt-1 text-xs text-red-500">{addError}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => !open && setEditOpen(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Editar Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (editError) setEditError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              autoFocus
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${editError ? "border-red-400" : "border-gray-300"}`}
            />
            {editError && (
              <p className="mt-1 text-xs text-red-500">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
