import { Link } from "react-router";

export function ChangePasswordPage() {
  // TODO(integracao): substituir esta tela quando houver suporte a senha; hoje o acesso é por código.
  return (
    <div className="space-y-4 p-4 md:p-8">
      <Link to="/app/settings" className="text-brand-700 underline">
        ← Voltar para Configurações
      </Link>
      <h1 className="text-2xl font-semibold">Trocar senha</h1>
      <p className="rounded-xl border bg-white p-6">
        Recurso demonstrativo pendente de integração. O acesso atual utiliza um código de
        verificação por telefone e não possui senha.
      </p>
    </div>
  );
}
