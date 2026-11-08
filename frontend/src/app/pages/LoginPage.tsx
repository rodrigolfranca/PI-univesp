import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useSite } from "../config/SiteContext";
import { BrandLogo } from "../components/BrandLogo";
import { RequestState } from "../components/RequestState";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { requestLoginCode, requestRecoveryCode, verifyRecoveryCode } from "../services/auth";
import { normalizePhone } from "../services/users";

type Mode = "login" | "recovery";

export function LoginPage() {
  const site = useSite();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatmentId = params.get("treatmentId");
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"email" | "verify">("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
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

  async function submitRecovery(action: "request" | "verify") {
    if (submitting.current) return;
    setError("");
    setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!/^\d{11}$/.test(normalizePhone(recoveryPhone))) {
      setError("Informe o DDD e o novo telefone com 11 dígitos.");
      return;
    }
    if (action === "verify" && !/^\d{6}$/.test(recoveryCode)) {
      setError("Informe o código de seis dígitos.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      if (action === "request") {
        await requestRecoveryCode(recoveryEmail.trim(), recoveryPhone);
        setRecoveryStep("verify");
        setRecoveryCode("");
        setNotice(
          "Se o e-mail estiver cadastrado, um código será gerado. Ele expira em cinco minutos.",
        );
      } else {
        await verifyRecoveryCode(recoveryEmail.trim(), recoveryPhone, recoveryCode);
        setPhone(recoveryPhone);
        setMode("login");
        setStep("phone");
        setCode("");
        setRecoveryStep("email");
        setRecoveryEmail("");
        setRecoveryPhone("");
        setRecoveryCode("");
        toast.success("Telefone atualizado. Solicite um novo código para entrar.");
        setNotice("Telefone atualizado. Solicite um novo código para entrar.");
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
    if (mode === "recovery") {
      void submitRecovery(recoveryStep === "email" ? "request" : "verify");
      return;
    }
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

  function openRecovery() {
    setMode("recovery");
    setRecoveryStep("email");
    setError("");
    setNotice("");
  }

  function backToLogin() {
    setMode("login");
    setError("");
    setNotice("");
  }

  const isRecovery = mode === "recovery";
  const title = isRecovery ? "Recuperar conta" : "Entre na sua conta";
  const submitLabel = isRecovery
    ? recoveryStep === "email"
      ? "Enviar código por e-mail"
      : "Atualizar telefone"
    : getSubmitLabel(pending, step);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <p className="text-center text-sm text-gray-600">
          {isRecovery
            ? "Informe o e-mail cadastrado para alterar seu telefone de acesso."
            : site.content.authTagline}
        </p>
        <h1 className="text-center text-3xl font-bold text-brand-800">{title}</h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <RequestState error={error} />
          {notice && (
            <p role="status" className="text-sm text-gray-600">
              {notice}
            </p>
          )}

          {isRecovery ? (
            <>
              <div>
                <label htmlFor="recovery-email" className="mb-1 block font-medium">
                  E-mail
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  value={recoveryEmail}
                  readOnly={recoveryStep === "verify"}
                  disabled={pending}
                  onChange={(event) => setRecoveryEmail(event.currentTarget.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="recovery-phone" className="mb-1 block font-medium">
                  Novo telefone
                </label>
                <input
                  id="recovery-phone"
                  type="tel"
                  autoComplete="tel-national"
                  value={recoveryPhone}
                  readOnly={recoveryStep === "verify"}
                  disabled={pending}
                  onChange={(event) => setRecoveryPhone(event.currentTarget.value)}
                  placeholder="(11) 94002-8922"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {recoveryStep === "verify" && (
                <>
                  <div>
                    <label htmlFor="recovery-code" className="mb-1 block font-medium">
                      Código de recuperação
                    </label>
                    <input
                      id="recovery-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={recoveryCode}
                      disabled={pending}
                      onChange={(event) =>
                        setRecoveryCode(event.currentTarget.value.replace(/\D/g, ""))
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="mt-2 text-sm text-amber-800">
                      O envio ainda é por log. Obtenha o código no terminal do backend.
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
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
                  <p className="mt-2 text-sm text-amber-800">
                    O envio por WhatsApp está pendente. Obtenha o código no log do backend.
                  </p>
                </div>
              )}
            </>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Aguarde..." : submitLabel}
          </Button>

          {!isRecovery && step === "code" && (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={pending} onClick={handleResendCode}>
                Reenviar código
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={handleCorrectPhone}>
                Corrigir telefone
              </Button>
            </div>
          )}

          {isRecovery && recoveryStep === "verify" && (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => void submitRecovery("request")}
              >
                Reenviar código
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={backToLogin}>
                Voltar ao login
              </Button>
            </div>
          )}
        </form>

        {!isRecovery && (
          <Link
            to={treatmentId ? `/signup?${new URLSearchParams({ treatmentId })}` : "/signup"}
            className="block text-center text-brand-700 underline"
          >
            Cadastre-se
          </Link>
        )}

        {isRecovery ? (
          <button
            type="button"
            onClick={backToLogin}
            className="block w-full text-center text-sm text-gray-600"
          >
            ← Voltar para o login
          </button>
        ) : (
          <button
            type="button"
            onClick={openRecovery}
            className="block w-full text-center text-sm text-brand-700 underline"
          >
            Recuperar conta por e-mail
          </button>
        )}

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
