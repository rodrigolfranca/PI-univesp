import { ArrowLeft, Plus, Search, Mail, Phone, MoreVertical, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router";

export function EmployeesPage() {
  const employees = [
    { id: 1, name: 'Dra. Sofia Martins', role: 'Administradora', email: 'sofia.martins@estetica.com', phone: '(11) 99876-5432', status: 'Ativo' },
    { id: 2, name: 'Carla Mendes', role: 'Esteticista', email: 'carla.mendes@estetica.com', phone: '(11) 98765-4321', status: 'Ativo' },
    { id: 3, name: 'Beatriz Alves', role: 'Recepcionista', email: 'beatriz.alves@estetica.com', phone: '(11) 97654-3210', status: 'Ativo' },
    { id: 4, name: 'Laura Santos', role: 'Esteticista', email: 'laura.santos@estetica.com', phone: '(11) 96543-2109', status: 'Ativo' },
    { id: 5, name: 'Rodrigo Lima', role: 'Auxiliar', email: 'rodrigo.lima@estetica.com', phone: '(11) 95432-1098', status: 'Férias' },
  ];

  return (
    <div className="p-4 md:p-8">
      <Link to="/settings" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        Voltar para Configurações
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Funcionários</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Gerencie a equipe da clínica</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar funcionários..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent bg-gray-50"
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
            {employees.map((employee) => (
              <div key={employee.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-wine-400 to-wine-600 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-white text-sm">{employee.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mb-2">
                      {employee.role}
                    </span>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        {employee.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Nome</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Cargo</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Contato</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wine-400 to-wine-600 flex items-center justify-center">
                          <span className="font-medium text-white text-sm">{employee.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <span className="font-medium text-gray-900">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {employee.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {employee.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Ativo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-wine-600 text-white rounded-full shadow-lg hover:bg-wine-700 transition-all hover:scale-110 flex items-center justify-center z-40">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
