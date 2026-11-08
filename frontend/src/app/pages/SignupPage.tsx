import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useSite } from "../config/SiteContext";
import { BrandLogo } from "../components/BrandLogo";
import { UserForm } from "../components/UserForm";
import { createUser } from "../services/users";
import type { UserFields } from "../services/users";

export function SignupPage() {
  const site = useSite();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatmentId = params.get("treatmentId");
  const loginUrl = treatmentId ? `/login?${new URLSearchParams({ treatmentId })}` : "/login";

  function handleSubmit(fields: UserFields) {
    return createUser("client", fields);
  }

  function handleSuccess() {
    toast.success("Cadastro realizado. Entre com seu telefone e código.");
    navigate(loginUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <p className="text-center text-sm text-gray-600">{site.content.authTagline}</p>
        <h1 className="text-center text-3xl font-bold text-brand-800">Cadastre-se</h1>
        <UserForm onSubmit={handleSubmit} submitLabel="Cadastrar" onSuccess={handleSuccess} />
        <Link to={loginUrl} className="block text-center text-brand-700 underline">
          Já tenho uma conta
        </Link>
        <Link to="/" className="block text-center text-sm text-gray-600">
          ← Voltar para Home
        </Link>
      </div>
    </main>
  );
}
