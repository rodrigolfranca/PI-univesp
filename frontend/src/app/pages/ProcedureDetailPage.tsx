import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, DollarSign, FileText, Upload, Trash2, Download, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import { useProcedures } from "../context/ProceduresContext";
import { useCategories } from "../context/CategoriesContext";

interface POPDocument {
  id: number;
  name: string;
  uploadDate: string;
  size: string;
  url: string;
}

type ProcedureForm = {
  name: string;
  category: string;
  duration: string;
  price: string;
  status: string;
  description: string;
};

export function ProcedureDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { procedures, editProcedure } = useProcedures();
  const { categories } = useCategories();

  const procedure = procedures.find((p) => p.id === Number(id));

  const [showAddPOP, setShowAddPOP] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProcedureForm>({
    name: "", category: "", duration: "", price: "", status: "Ativo", description: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<ProcedureForm>>({});

  const [popDocuments, setPopDocuments] = useState<POPDocument[]>([
    { id: 1, name: "POP - Limpeza de Pele Profunda.pdf", uploadDate: "15/05/2024", size: "2.3 MB", url: "#" },
    { id: 2, name: "Checklist Pré-Procedimento.pdf",     uploadDate: "10/05/2024", size: "1.1 MB", url: "#" },
  ]);

  if (!procedure) {
    return (
      <div className="p-4 md:p-8">
        <button onClick={() => navigate("/app/procedures")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para Procedimentos</span>
        </button>
        <p className="text-gray-500">Procedimento não encontrado.</p>
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
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (editErrors[field]) setEditErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleEditSubmit() {
    const newErrors: Partial<ProcedureForm> = {};
    if (!editForm.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!editForm.category) newErrors.category = "Categoria é obrigatória";
    if (!editForm.duration.trim()) newErrors.duration = "Duração é obrigatória";
    if (!editForm.price.trim()) newErrors.price = "Preço é obrigatório";
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }

    editProcedure(procedure!.id, {
      name: editForm.name,
      category: editForm.category,
      duration: editForm.duration,
      price: editForm.price.startsWith("R$") ? editForm.price : `R$ ${editForm.price}`,
      status: editForm.status,
      description: editForm.description,
    });
    toast.success("Procedimento atualizado com sucesso");
    setEditOpen(false);
  }

  const handleDeletePOP = (popId: number) => {
    setPopDocuments(popDocuments.filter((doc) => doc.id !== popId));
  };

  const handleAddPOP = () => {
    const newDoc: POPDocument = {
      id: Date.now(),
      name: "Novo Documento POP.pdf",
      uploadDate: new Date().toLocaleDateString("pt-BR"),
      size: "1.5 MB",
      url: "#",
    };
    setPopDocuments([...popDocuments, newDoc]);
    setShowAddPOP(false);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate("/app/procedures")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para Procedimentos</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{procedure.name}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">{procedure.category}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes do Procedimento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Gerais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Informações Gerais</h2>
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
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  procedure.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {procedure.status}
                </span>
              </div>
            </div>
          </div>

          {/* Documentos POP */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Documentos POP</h2>
                <p className="text-sm text-gray-500 mt-1">Procedimento Operacional Padrão</p>
              </div>
              <button
                onClick={() => setShowAddPOP(true)}
                className="flex items-center gap-2 px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Adicionar</span>
              </button>
            </div>
            <div className="space-y-3">
              {popDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum documento POP cadastrado</p>
                </div>
              ) : (
                popDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-wine-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-wine-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-500">{doc.uploadDate} • {doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => window.open(doc.url, "_blank")} className="p-2 text-gray-600 hover:text-wine-600 hover:bg-wine-50 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeletePOP(doc.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <button
                onClick={openEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-wine-600 text-wine-600 rounded-lg hover:bg-wine-50 transition-colors font-medium"
              >
                Editar Procedimento
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors font-medium">
                Agendar Procedimento
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Agendamentos este mês</p>
                <p className="text-2xl font-bold text-wine-600">12</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Documentos POP</p>
                <p className="text-2xl font-bold text-gray-900">{popDocuments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar POP */}
      {showAddPOP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Adicionar Documento POP</h3>
              <button onClick={() => setShowAddPOP(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Documento</label>
                <input type="text" placeholder="Ex: POP - Limpeza de Pele.pdf" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Arquivo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-wine-600 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX até 10MB</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddPOP(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancelar</button>
                <button onClick={handleAddPOP} className="flex-1 px-4 py-3 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors font-medium">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Editar Procedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-wine-600">*</span></label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleEditField("name", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 bg-gray-50 ${editErrors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {editErrors.name && <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-wine-600">*</span></label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleEditField("category", cat.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      editForm.category === cat.name ? "bg-wine-600 text-white border-wine-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {editErrors.category && <p className="mt-1 text-xs text-red-500">{editErrors.category}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração <span className="text-wine-600">*</span></label>
                <input
                  type="text"
                  value={editForm.duration}
                  onChange={(e) => handleEditField("duration", e.target.value)}
                  placeholder="Ex: 60 min"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 bg-gray-50 ${editErrors.duration ? "border-red-400" : "border-gray-300"}`}
                />
                {editErrors.duration && <p className="mt-1 text-xs text-red-500">{editErrors.duration}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço <span className="text-wine-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="text"
                    value={editForm.price}
                    onChange={(e) => handleEditField("price", e.target.value)}
                    placeholder="0,00"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 bg-gray-50 ${editErrors.price ? "border-red-400" : "border-gray-300"}`}
                  />
                </div>
                {editErrors.price && <p className="mt-1 text-xs text-red-500">{editErrors.price}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                {["Ativo", "Inativo"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleEditField("status", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      editForm.status === s
                        ? s === "Ativo" ? "bg-green-600 text-white border-green-600" : "bg-gray-500 text-white border-gray-500"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea
                value={editForm.description}
                onChange={(e) => handleEditField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 bg-gray-50 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleEditSubmit} className="px-5 py-2.5 bg-wine-600 text-white rounded-lg text-sm font-medium hover:bg-wine-700 transition-colors">
              Salvar Alterações
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
