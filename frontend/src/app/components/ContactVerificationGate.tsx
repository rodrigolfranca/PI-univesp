import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { BrandLogo } from "./BrandLogo";
import { RequestState } from "./RequestState";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { formatCountdown, useOtpCountdown } from "../hooks/useOtpCountdown";
import { errorMessage } from "../services/api";
import { requestEmailConfirmation, verifyContactChange } from "../services/contact-change";

export function ContactVerificationGate({ children }: { children: ReactNode }) {
  const { user, token, retrySession, logout } = useAuth();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { remainingSeconds, resendInSeconds, expired, canResend, start, reset } = useOtpCountdown();

  if (!user || user.emailConfirmed !== false) return <>{children}</>;

  async function handleRequest() {
    if (!user || !token || pending) return;
    setPending(true);
    setError("");
    try {
      const policy = await requestEmailConfirmation(user.userId, token);
      setSent(true);
      setCode("");
      setNotice("Código enviado. Consulte o log do backend.");
      start(policy.expires_in, policy.resend_after);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleVerify() {
    if (!user || !token || pending) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Informe o código de seis dígitos.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await verifyContactChange(user.userId, "email", user.email, code, token);
      reset();
      toast.success("E-mail confirmado.");
      retrySession();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size="auth" />
        </div>
        <h1 className="text-center text-2xl font-bold text-brand-800">Confirme seu e-mail</h1>
        <p className="text-center text-sm text-gray-600">
          Antes de continuar, confirme o e-mail <strong>{user.email}</strong>.
        </p>
        <RequestState error={error} />
        {notice && (
          <p role="status" className="text-sm text-gray-600">
            {notice}
          </p>
        )}
        {sent && (
          <>
            <div>
              <label htmlFor="contact-verification-code" className="mb-1 block font-medium">
                Código do e-mail
              </label>
              <input
                id="contact-verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                disabled={pending}
                onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, ""))}
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
            <Button
              type="button"
              className="w-full"
              disabled={pending || expired || code.length !== 6}
              onClick={() => void handleVerify()}
            >
              {pending ? "Confirmando..." : "Confirmar e continuar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending || !canResend}
              onClick={() => void handleRequest()}
            >
              {canResend ? "Reenviar código" : `Reenviar em ${formatCountdown(resendInSeconds)}`}
            </Button>
          </>
        )}
        {!sent && (
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => void handleRequest()}
          >
            {pending ? "Enviando..." : "Enviar código"}
          </Button>
        )}
        <Button type="button" variant="ghost" className="w-full" onClick={logout}>
          Sair
        </Button>
      </div>
    </main>
  );
}
