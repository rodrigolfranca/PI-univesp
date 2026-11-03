import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
export function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <div className="p-4 md:p-8">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        Voltar para Configurações
      </Link>

      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Trocar Senha
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Atualize sua senha de acesso
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8">
          <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 md:mb-8">
            <Lock className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas para uma senha segura:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Use no mínimo 8 caracteres</li>
                <li>Combine letras maiúsculas e minúsculas</li>
                <li>Inclua números e símbolos especiais</li>
              </ul>
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-6 border-t border-gray-200">
              <Link
                to="/settings"
                className="flex-1 px-4 md:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="flex-1 px-4 md:px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Atualizar Senha
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
