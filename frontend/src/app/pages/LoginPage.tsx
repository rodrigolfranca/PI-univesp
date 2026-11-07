import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useSite } from "../config/SiteContext";
import { BrandLogo } from "../components/BrandLogo";
import { RequestState } from "../components/RequestState";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { requestLoginCode } from "../services/auth";
import { normalizePhone } from "../services/users";

export function LoginPage() {
  const site = useSite();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatmentId = params.get("treatmentId");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);

  async function submit(action: "request" | "verify") {
    if (submitting.current) return;
    setError("");
    setNotice("");
    if (!/^\d{11}$/.test(normalizePhone(phone))) {
      setError("Informe o DDD e o telefone com 11 dígitos.");
      return;
    }
    if (action === "verify" && !/^\d{6}$/.test(code)) {
      setError("Informe o código de seis dígitos.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      if (action === "request") {
        await requestLoginCode(phone);
        setCode("");
        setStep("code");
        setNotice(
          "Se o telefone estiver cadastrado, um código será gerado. Ele expira em cinco minutos.",
        );
      } else {
        const user = await login(phone, code);
        navigate(getLoginDestination(user.role, treatmentId), { replace: true });
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(step === "phone" ? "request" : "verify");
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    setPhone(event.currentTarget.value);
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(event.currentTarget.value.replace(/\D/g, ""));
  }

  function handleResendCode() {
    void submit("request");
  }

  function handleCorrectPhone() {
    setStep("phone");
    setCode("");
    setError("");
    setNotice("");
  }

  const submitLabel = getSubmitLabel(pending, step);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <p className="text-center text-sm text-gray-600">{site.content.authTagline}</p>
        <h1 className="text-center text-3xl font-bold text-brand-800">Entre na sua conta</h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <RequestState error={error} />
          {notice && (
            <p role="status" className="text-sm text-gray-600">
              {notice}
            </p>
          )}
          <div>
            <label htmlFor="login-phone" className="mb-1 block font-medium">
              Telefone
            </label>
            <input
              id="login-phone"
              type="tel"
              autoComplete="tel-national"
              value={phone}
              readOnly={step === "code"}
              disabled={pending}
              onChange={handlePhoneChange}
              placeholder="(11) 94002-8922"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {step === "code" && (
            <div>
              <label htmlFor="login-code" className="mb-1 block font-medium">
                Código de verificação
              </label>
              <input
                id="login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                disabled={pending}
                onChange={handleCodeChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
              />
              {/* TODO(integracao): retirar a orientação quando o backend enviar os códigos por WhatsApp. */}
              <p className="mt-2 text-sm text-amber-800">
                O envio por WhatsApp está pendente. Em desenvolvimento, obtenha o código no log do
                backend.
              </p>
            </div>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {submitLabel}
          </Button>
          {step === "code" && (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={pending} onClick={handleResendCode}>
                Reenviar código
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={handleCorrectPhone}>
                Corrigir telefone
              </Button>
            </div>
          )}
        </form>
        <Link
          to={treatmentId ? `/signup?${new URLSearchParams({ treatmentId })}` : "/signup"}
          className="block text-center text-brand-700 underline"
        >
          Cadastre-se
        </Link>
        {/* TODO(integracao): conectar as duas etapas de recuperação por e-mail em uma próxima entrega. */}
        <p className="text-sm text-gray-500">Recuperação de conta por e-mail: em breve.</p>
        <Link to="/" className="block text-center text-sm text-gray-600">
          ← Voltar para Home
        </Link>
      </div>
    </main>
  );
}

function getLoginDestination(role: UserRole, treatmentId: string | null): string {
  if (role === "employee") return "/app/appointments";
  if (treatmentId) return `/agendar/${encodeURIComponent(treatmentId)}`;
  return "/cliente/agendamentos";
}

function getSubmitLabel(pending: boolean, step: "phone" | "code"): string {
  if (pending) return "Aguarde...";
  if (step === "phone") return "Solicitar código";
  return "Entrar";
}
