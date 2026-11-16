import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { useSite } from "../config/SiteContext";
import { BackIconLink } from "../components/BackIconLink";
import { BrandLogo } from "../components/BrandLogo";
import { RequestState } from "../components/RequestState";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { formatCountdown, useOtpCountdown } from "../hooks/useOtpCountdown";
import { ApiError, errorMessage } from "../services/api";
import {
  requestLoginCode,
  requestRecoveryEmailCode,
  requestRecoveryPhoneCode,
  verifyRecoveryEmailCode,
  verifyRecoveryPhoneCode,
} from "../services/auth";
import { normalizePhone } from "../services/users";

type Mode = "login" | "recovery";
type RecoveryStep = "email" | "email-code" | "phone" | "phone-code";

export function LoginPage() {
  const site = useSite();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const treatmentId = params.get("treatmentId");
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState(() => {
    const value = (location.state as { phone?: unknown } | null)?.phone;
    return typeof value === "string" ? value : "";
  });
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("email");
  const [recoveryId, setRecoveryId] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryEmailCode, setRecoveryEmailCode] = useState("");
  const [recoveryPhoneCode, setRecoveryPhoneCode] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    const value = (location.state as { phone?: unknown } | null)?.phone;
    if (typeof value === "string") {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, location.state, navigate]);
  const { remainingSeconds, resendInSeconds, expired, canResend, start, reset } = useOtpCountdown();

  async function submit(action: "request" | "verify") {
    if (submitting.current) return;
    setError("");
    setNotice("");
    setAccountNotFound(false);
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
        const policy = await requestLoginCode(phone);
        setCode("");
        setStep("code");
        start(policy.expires_in, policy.resend_after);
        setNotice("Código gerado. Consulte o log do backend.");
      } else {
        const user = await login(phone, code);
        reset();
        navigate(getLoginDestination(user.role, treatmentId), { replace: true });
      }
    } catch (cause) {
      if (action === "request" && cause instanceof ApiError && cause.status === 404) {
        setAccountNotFound(true);
      }
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  async function submitRecovery(
    action: "request-email" | "verify-email" | "request-phone" | "verify-phone",
  ) {
    if (submitting.current) return;
    setError("");
    setNotice("");
    setAccountNotFound(false);
    if (
      (action === "request-email" || action === "verify-email") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())
    ) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (action === "verify-email" && !/^\d{6}$/.test(recoveryEmailCode)) {
      setError("Informe o código de seis dígitos do e-mail.");
      return;
    }
    if (
      (action === "request-phone" || action === "verify-phone") &&
      !/^\d{11}$/.test(normalizePhone(recoveryPhone))
    ) {
      setError("Informe o DDD e o novo telefone com 11 dígitos.");
      return;
    }
    if (action === "verify-phone" && !/^\d{6}$/.test(recoveryPhoneCode)) {
      setError("Informe o código de seis dígitos do novo telefone.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      if (action === "request-email") {
        const policy = await requestRecoveryEmailCode(recoveryEmail.trim());
        setRecoveryId(policy.recovery_id);
        setRecoveryStep("email-code");
        setRecoveryEmailCode("");
        setRecoveryPhoneCode("");
        start(policy.expires_in, policy.resend_after);
      } else if (action === "verify-email") {
        await verifyRecoveryEmailCode(recoveryId, recoveryEmailCode);
        reset();
        setRecoveryStep("phone");
        setRecoveryEmailCode("");
        setRecoveryPhone("");
        setRecoveryPhoneCode("");
      } else if (action === "request-phone") {
        const policy = await requestRecoveryPhoneCode(recoveryId, recoveryPhone);
        setRecoveryStep("phone-code");
        setRecoveryPhoneCode("");
        start(policy.expires_in, policy.resend_after);
      } else {
        await verifyRecoveryPhoneCode(recoveryId, recoveryPhone, recoveryPhoneCode);
        reset();
        setPhone(recoveryPhone);
        setMode("login");
        setStep("phone");
        setCode("");
        setRecoveryStep("email");
        setRecoveryId("");
        setRecoveryEmail("");
        setRecoveryPhone("");
        setRecoveryEmailCode("");
        setRecoveryPhoneCode("");
        toast.success("Telefone atualizado. Solicite um novo código para entrar.");
        setNotice("Telefone atualizado. Solicite um novo código para entrar.");
      }
    } catch (cause) {
      if (action === "request-email" && cause instanceof ApiError && cause.status === 404) {
        setAccountNotFound(true);
      }
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "recovery") {
      const action =
        recoveryStep === "email"
          ? "request-email"
          : recoveryStep === "email-code"
            ? "verify-email"
            : recoveryStep === "phone"
              ? "request-phone"
              : "verify-phone";
      void submitRecovery(action);
      return;
    }
    void submit(step === "phone" ? "request" : "verify");
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    if (step === "code") {
      reset();
      setStep("phone");
      setCode("");
      setNotice("");
    }
    setPhone(value);
    setError("");
    setAccountNotFound(false);
  }

  function handleRecoveryEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    if (recoveryStep === "email-code") {
      reset();
      setRecoveryStep("email");
      setRecoveryId("");
      setRecoveryEmailCode("");
      setRecoveryPhoneCode("");
      setRecoveryPhone("");
      setNotice("");
    }
    setRecoveryEmail(value);
    setError("");
    setAccountNotFound(false);
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(event.currentTarget.value.replace(/\D/g, ""));
  }

  function handleResendCode() {
    void submit("request");
  }

  function handleResendRecovery() {
    void submitRecovery(recoveryStep === "email-code" ? "request-email" : "request-phone");
  }

  function handleRecoveryPhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    if (recoveryStep === "phone-code") {
      reset();
      setRecoveryStep("phone");
      setRecoveryPhoneCode("");
      setNotice("");
    }
    setRecoveryPhone(value);
    setError("");
  }

  function openRecovery() {
    reset();
    setMode("recovery");
    setRecoveryStep("email");
    setRecoveryId("");
    setRecoveryEmail("");
    setRecoveryPhone("");
    setRecoveryEmailCode("");
    setRecoveryPhoneCode("");
    setStep("phone");
    setCode("");
    setError("");
    setNotice("");
    setAccountNotFound(false);
  }

  function backToLogin() {
    reset();
    setMode("login");
    setRecoveryStep("email");
    setRecoveryId("");
    setRecoveryEmail("");
    setRecoveryPhone("");
    setRecoveryEmailCode("");
    setRecoveryPhoneCode("");
    setError("");
    setNotice("");
    setAccountNotFound(false);
  }

  const isRecovery = mode === "recovery";
  const signupUrl = treatmentId ? `/signup?${new URLSearchParams({ treatmentId })}` : "/signup";
  const codeStepActive = isRecovery
    ? recoveryStep === "email-code" || recoveryStep === "phone-code"
    : step === "code";
  const codeExpired = codeStepActive && expired;
  const title = isRecovery ? "Recuperar conta" : "Entre na sua conta";
  const recoveryHelper =
    recoveryStep === "email"
      ? "Informe o e-mail cadastrado para iniciar a recuperação."
      : recoveryStep === "email-code"
        ? `Confirme o código enviado para ${recoveryEmail}.`
        : recoveryStep === "phone"
          ? "E-mail confirmado. Informe o novo telefone da conta."
          : `Confirme o código enviado para ${recoveryPhone}.`;
  const submitLabel = isRecovery
    ? recoveryStep === "email" || recoveryStep === "phone"
      ? "Enviar código"
      : recoveryStep === "email-code"
        ? "Confirmar código"
        : "Confirmar novo telefone"
    : getSubmitLabel(pending, step);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="relative w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        {isRecovery ? <BackIconLink onClick={backToLogin} /> : <BackIconLink />}
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <p className="text-center text-sm text-gray-600">
          {isRecovery ? recoveryHelper : site.content.authTagline}
        </p>
        <h1 className="text-center text-3xl font-bold text-brand-800">{title}</h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <RequestState error={error} />
          {accountNotFound && !isRecovery && (
            <Link to={signupUrl} className="block text-sm text-brand-700 underline">
              Fazer cadastro
            </Link>
          )}
          {notice && (
            <p role="status" className="text-sm text-gray-600">
              {notice}
            </p>
          )}

          {isRecovery ? (
            <>
              {(recoveryStep === "email" || recoveryStep === "email-code") && (
                <div>
                  <label htmlFor="recovery-email" className="mb-1 block font-medium">
                    E-mail
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={recoveryEmail}
                    disabled={pending}
                    onChange={handleRecoveryEmailChange}
                    placeholder="voce@exemplo.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {(recoveryStep === "phone" || recoveryStep === "phone-code") && (
                <div>
                  <label htmlFor="recovery-phone" className="mb-1 block font-medium">
                    Novo telefone
                  </label>
                  <input
                    id="recovery-phone"
                    type="tel"
                    autoComplete="tel-national"
                    value={recoveryPhone}
                    disabled={pending}
                    onChange={handleRecoveryPhoneChange}
                    placeholder="(11) 94002-8922"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {recoveryStep === "email-code" && (
                <div>
                  <label htmlFor="recovery-email-code" className="mb-1 block font-medium">
                    Código do e-mail
                  </label>
                  <input
                    id="recovery-email-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={recoveryEmailCode}
                    disabled={pending}
                    onChange={(event) =>
                      setRecoveryEmailCode(event.currentTarget.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="mt-2 text-sm text-amber-800">
                    O envio é por log. Obtenha o código no terminal do backend.
                  </p>
                  <p
                    role="timer"
                    aria-live={expired ? "polite" : "off"}
                    className={expired ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-gray-600"}
                  >
                    {expired
                      ? "Código expirado. Reenvie para continuar."
                      : `Código válido por ${formatCountdown(remainingSeconds)}`}
                  </p>
                </div>
              )}

              {recoveryStep === "phone-code" && (
                <div>
                  <label htmlFor="recovery-phone-code" className="mb-1 block font-medium">
                    Código do novo telefone
                  </label>
                  <input
                    id="recovery-phone-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={recoveryPhoneCode}
                    disabled={pending}
                    onChange={(event) =>
                      setRecoveryPhoneCode(event.currentTarget.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="mt-2 text-sm text-amber-800">
                    O envio é por log. Obtenha o código no terminal do backend.
                  </p>
                  <p
                    role="timer"
                    aria-live={expired ? "polite" : "off"}
                    className={expired ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-gray-600"}
                  >
                    {expired
                      ? "Código expirado. Reenvie para continuar."
                      : `Código válido por ${formatCountdown(remainingSeconds)}`}
                  </p>
                </div>
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
                    O envio é por log. Obtenha o código no terminal do backend.
                  </p>
                  <p
                    role="timer"
                    aria-live={expired ? "polite" : "off"}
                    className={expired ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-gray-600"}
                  >
                    {expired
                      ? "Código expirado. Reenvie para continuar."
                      : `Código válido por ${formatCountdown(remainingSeconds)}`}
                  </p>
                </div>
              )}
            </>
          )}

          <Button type="submit" disabled={pending || codeExpired} className="w-full">
            {pending ? "Aguarde..." : submitLabel}
          </Button>

          {!isRecovery && step === "code" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || !canResend}
              onClick={handleResendCode}
            >
              {getResendLabel(canResend, resendInSeconds)}
            </Button>
          )}

          {isRecovery && recoveryStep === "email-code" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || !canResend}
              onClick={handleResendRecovery}
            >
              {getResendLabel(canResend, resendInSeconds)}
            </Button>
          )}

          {isRecovery && recoveryStep === "phone-code" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || !canResend}
              onClick={handleResendRecovery}
            >
              {getResendLabel(canResend, resendInSeconds)}
            </Button>
          )}
        </form>

        {!isRecovery && step === "phone" && !accountNotFound && (
          <Link to={signupUrl} className="block text-center text-brand-700 underline">
            Cadastre-se
          </Link>
        )}

        {!isRecovery && step === "phone" && !accountNotFound && (
          <button
            type="button"
            onClick={openRecovery}
            className="block w-full text-center text-sm text-brand-700 underline"
          >
            Recuperar conta
          </button>
        )}

        {isRecovery && <div aria-hidden="true" className="h-6" />}
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

function getResendLabel(canResend: boolean, resendInSeconds: number): string {
  return canResend ? "Reenviar código" : `Reenviar em ${formatCountdown(resendInSeconds)}`;
}
