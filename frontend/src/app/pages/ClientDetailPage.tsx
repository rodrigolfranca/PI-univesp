import { useSite } from "../config/SiteContext";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  X,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useClients } from "../context/ClientsContext";
import { useAppointments } from "../context/AppointmentsContext";

interface ClientDocument {
  id: number;
  name: string;
  uploadDate: string;
  size: string;
  url: string;
}

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  status: string;
};

export function ClientDetailPage() {
  const site = useSite();
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, editClient } = useClients();
  const { appointments } = useAppointments();
  const client = clients.find((c) => c.id === Number(id));
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ClientForm>({
    name: "",
    phone: "",
    email: "",
    status: "Ativo",
  });
  const [editErrors, setEditErrors] = useState<Partial<ClientForm>>({});
  const [activeTab, setActiveTab] = useState<"all" | "Confirmado" | "Pendente" | "Cancelado">(
    "all",
  );
  const [documents, setDocuments] = useState<ClientDocument[]>(site.data.clientDocuments);
  if (!client) {
    return (
      <div className="p-4 md:p-8">
        <button
          onClick={() => navigate("/app/clients")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para Clientes</span>
        </button>
        <p className="text-gray-500">Cliente não encontrado.</p>
      </div>
    );
  }

  const clientAppointments = appointments.filter((a) => a.client === client.name);
  const filteredAppointments =
    activeTab === "all"
      ? clientAppointments
      : clientAppointments.filter((a) => a.status === activeTab);

  function openEdit() {
    setEditForm({
      name: client!.name,
      phone: client!.phone,
      email: client!.email,
      status: client!.status,
    });
    setEditErrors({});
    setEditOpen(true);
  }

  function handleEditField(field: keyof ClientForm, value: string) {
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

  function handleEditSubmit() {
    const newErrors: Partial<ClientForm> = {};
    if (!editForm.name.trim()) newErrors.name = "Nome é obrigatório";

    if (!editForm.phone.trim()) newErrors.phone = "Telefone é obrigatório";

    if (!editForm.email.trim()) newErrors.email = "E-mail é obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    editClient(client!.id, {
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      status: editForm.status,
    });
    toast.success("Cliente atualizado com sucesso");
    setEditOpen(false);
  }

  const handleDeleteDocument = (docId: number) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  };

  const handleAddDocument = () => {
    const newDoc: ClientDocument = {
      id: Date.now(),
      name: "Novo Documento.pdf",
      uploadDate: new Date().toLocaleDateString("pt-BR"),
      size: "1.0 MB",
      url: "#",
    };
    setDocuments([...documents, newDoc]);
    setShowAddDocument(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === "Confirmado") return <CheckCircle className="w-5 h-5 text-green-600" />;

    if (status === "Pendente") return <Clock className="w-5 h-5 text-yellow-600" />;

    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === "Confirmado") return "Confirmado";

    if (status === "Pendente") return "Pendente";

    return "Cancelado";
  };

  const getStatusColor = (status: string) => {
    if (status === "Confirmado") return "bg-green-100 text-green-700";

    if (status === "Pendente") return "bg-yellow-100 text-yellow-700";

    return "bg-red-100 text-red-700";
  };

  const tabCounts = {
    all: clientAppointments.length,
    Confirmado: clientAppointments.filter((a) => a.status === "Confirmado").length,
    Pendente: clientAppointments.filter((a) => a.status === "Pendente").length,
    Cancelado: clientAppointments.filter((a) => a.status === "Cancelado").length,
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate("/app/clients")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para Clientes</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{client.name}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Última visita: {client.lastVisit}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Informações Pessoais
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${client.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {client.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Histórico de Agendamentos
            </h2>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(
                [
                  ["all", "Todos"],
                  ["Confirmado", "Confirmados"],
                  ["Pendente", "Pendentes"],
                  ["Cancelado", "Cancelados"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${activeTab === tab ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {label} ({tabCounts[tab]})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum agendamento encontrado</p>
                </div>
              ) : (
                filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">{getStatusIcon(appt.status)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{appt.procedure}</h3>
                        <p className="text-sm text-gray-500">
                          {appt.date} às {appt.time}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(appt.status)}`}
                    >
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Documentos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Anamneses, termos e documentos do cliente
                </p>
              </div>
              <button
                onClick={() => setShowAddDocument(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Adicionar</span>
              </button>
            </div>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum documento cadastrado</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-500">
                          {doc.uploadDate} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => window.open(doc.url, "_blank")}
                        className="p-2 text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
                Novo Agendamento
              </button>
              <button
                onClick={openEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-medium"
              >
                Editar Cliente
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Enviar Mensagem
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total de Agendamentos</p>
                <p className="text-2xl font-bold text-brand-600">{clientAppointments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Visita</p>
                <p className="text-lg font-semibold text-gray-900">{client.lastVisit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Documentos</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Adicionar Documento</h3>
              <button
                onClick={() => setShowAddDocument(false)}
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
                  placeholder="Ex: Anamnese - Ana Silva.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent">
                  <option>Anamnese</option>
                  <option>Termo de Consentimento</option>
                  <option>Contrato</option>
                  <option>Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Arquivo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-600 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG até 10MB</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddDocument(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDocument}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                >
                  Adicionar
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Editar Cliente
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
                Telefone <span className="text-brand-600">*</span>
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleEditField("phone", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 ${editErrors.phone ? "border-red-400" : "border-gray-300"}`}
              />
              {editErrors.phone && <p className="mt-1 text-xs text-red-500">{editErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span className="text-brand-600">*</span>
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditField("email", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 ${editErrors.email ? "border-red-400" : "border-gray-300"}`}
              />
              {editErrors.email && <p className="mt-1 text-xs text-red-500">{editErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2">
                {["Ativo", "Inativo"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleEditField("status", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${editForm.status === s ? (s === "Ativo" ? "bg-green-600 text-white border-green-600" : "bg-gray-500 text-white border-gray-500") : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
              onClick={handleEditSubmit}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Salvar Alterações
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
