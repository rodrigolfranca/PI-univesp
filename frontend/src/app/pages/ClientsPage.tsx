import { useTerminology } from "../config/SiteContext";
import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MoreVertical,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useClients } from "../context/ClientsContext";
type ClientForm = {
  name: string;
  phone: string;
  email: string;
  status: string;
};
const emptyForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  status: "Ativo",
};
export function ClientsPage() {
  const copy = useTerminology();
  const { clients, addClient } = useClients();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<ClientForm>>({});
  const filteredClients = clients.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );
  function handleField(field: keyof ClientForm, value: string) {
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
  function validate() {
    const newErrors: Partial<ClientForm> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!form.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (!form.email.trim()) newErrors.email = "E-mail é obrigatório";
    return newErrors;
  }
  function handleSubmit() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const today = new Date().toLocaleDateString("pt-BR");
    addClient({
      name: form.name,
      phone: form.phone,
      email: form.email,
      lastVisit: today,
      status: form.status,
    });
    toast.success("Cliente cadastrado com sucesso");
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
  }
  function handleClose() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(false);
  }
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          Clientes
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          {copy("Gerencie todos os clientes da clínica")}
        </p>
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
                placeholder="Buscar clientes..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white">
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              <span className="hidden md:inline text-gray-700">Filtros</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 md:divide-y-0">
          {/* Mobile View */}
          <div className="md:hidden">
            {filteredClients.map((client) => (
              <Link
                key={client.id}
                to={`/app/clients/${client.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-brand-600">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${client.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Última visita: {client.lastVisit}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Contato
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Última Visita
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/clients/${client.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="font-medium text-brand-600">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {client.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/app/clients/${client.id}`} className="block">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/app/clients/${client.id}`}
                        className="block text-sm text-gray-600"
                      >
                        {client.lastVisit}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/app/clients/${client.id}`} className="block">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${client.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {client.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center z-[60]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de Cadastro */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Novo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="Ex: Ana Silva"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone <span className="text-brand-600">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleField("phone", e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.phone ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span className="text-brand-600">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleField("email", e.target.value)}
                placeholder="Ex: ana.silva@email.com"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 ${errors.email ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
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
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Salvar Cliente
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
