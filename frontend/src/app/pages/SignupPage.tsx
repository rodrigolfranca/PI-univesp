import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useSite } from "../config/SiteContext";
import { BackIconLink } from "../components/BackIconLink";
import { BrandLogo } from "../components/BrandLogo";
import { RequestState } from "../components/RequestState";
import { Button } from "../components/ui/button";
import { UserForm } from "../components/UserForm";
import { formatCountdown, useOtpCountdown } from "../hooks/useOtpCountdown";
import { errorMessage } from "../services/api";
import {
  requestSignupCode,
  resendSignupCode,
  resendSignupPhoneCode,
  verifySignupEmailCode,
  verifySignupPhoneCode,
} from "../services/auth";
import type { SignupPolicy } from "../services/auth";
import { normalizePhone } from "../services/users";
import type { UserFields } from "../services/users";

type SignupStep = "form" | "email-code" | "phone-code";

export function SignupPage() {
  const site = useSite();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const treatmentId = params.get("treatmentId");
  const loginUrl = treatmentId ? `/login?${new URLSearchParams({ treatmentId })}` : "/login";
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [fields, setFields] = useState<UserFields | null>(null);
  const [signup, setSignup] = useState<SignupPolicy | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { remainingSeconds, resendInSeconds, expired, canResend, start, reset } = useOtpCountdown();

  async function handleSubmit(values: UserFields) {
    const policy = await requestSignupCode(values);
    setFields(values);
    setSignup(policy);
    setSignupStep("email-code");
    setPhoneCode("");
    setEmailCode("");
    setError("");
    start(policy.expires_in, policy.resend_after);
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signup || pending) return;
    if (!/^\d{6}$/.test(emailCode)) {
      setError("Informe o código de seis dígitos do e-mail.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const policy = await verifySignupEmailCode(signup.signup_id, emailCode);
      reset();
      setSignup(policy);
      setSignupStep("phone-code");
      setEmailCode("");
      setPhoneCode("");
      start(policy.expires_in, policy.resend_after);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signup || !fields || pending) return;
    if (!/^\d{6}$/.test(phoneCode)) {
      setError("Informe o código de seis dígitos do telefone.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await verifySignupPhoneCode(signup.signup_id, phoneCode);
      reset();
      toast.success("Cadastro confirmado. Entre com seu telefone e código.");
      navigate(loginUrl, { state: { phone: normalizePhone(fields.phone) } });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleResendEmail() {
    if (!signup || pending) return;
    setPending(true);
    setError("");
    try {
      const policy = await resendSignupCode(signup.signup_id);
      setSignup(policy);
      setEmailCode("");
      start(policy.expires_in, policy.resend_after);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleResendPhone() {
    if (!signup || pending) return;
    setPending(true);
    setError("");
    try {
      const policy = await resendSignupPhoneCode(signup.signup_id);
      setSignup(policy);
      setPhoneCode("");
      start(policy.expires_in, policy.resend_after);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  const codeExpired = signupStep !== "form" && expired;
  const isEmailCode = signupStep === "email-code";
  const codeHelper = isEmailCode
    ? `Confirme o código enviado para ${fields?.email ?? ""}.`
    : `Confirme o código enviado para ${fields?.phone ?? ""}.`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="relative w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <BackIconLink to={loginUrl} />
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <p className="text-center text-sm text-gray-600">{site.content.authTagline}</p>
        <h1 className="text-center text-3xl font-bold text-brand-800">
          {signupStep === "form" ? "Cadastre-se" : "Confirme seu cadastro"}
        </h1>

        {signupStep !== "form" && signup && fields ? (
          <form
            onSubmit={isEmailCode ? handleVerifyEmail : handleVerifyPhone}
            noValidate
            className="space-y-4"
          >
            <RequestState error={error} />
            <p className="text-sm text-gray-600">{codeHelper}</p>
            <div>
              <label
                htmlFor={isEmailCode ? "signup-email-code" : "signup-phone-code"}
                className="mb-1 block font-medium"
              >
                {isEmailCode ? "Código do e-mail" : "Código do telefone"}
              </label>
              <input
                id={isEmailCode ? "signup-email-code" : "signup-phone-code"}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={isEmailCode ? emailCode : phoneCode}
                disabled={pending}
                onChange={(event) => {
                  const value = event.currentTarget.value.replace(/\D/g, "");
                  if (isEmailCode) setEmailCode(value);
                  else setPhoneCode(value);
                }}
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
            <Button type="submit" disabled={pending || codeExpired} className="w-full">
              {pending ? "Aguarde..." : isEmailCode ? "Confirmar código" : "Confirmar cadastro"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || !canResend}
              onClick={() => void (isEmailCode ? handleResendEmail() : handleResendPhone())}
            >
              {canResend ? "Reenviar código" : `Reenviar em ${formatCountdown(resendInSeconds)}`}
            </Button>
          </form>
        ) : (
          <UserForm onSubmit={handleSubmit} submitLabel="Cadastrar" submitFullWidth />
        )}

        <Link to={loginUrl} className="block text-center text-brand-700 underline">
          Já tenho uma conta
        </Link>
      </div>
    </main>
  );
}
