import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { formatCountdown, useOtpCountdown } from "../hooks/useOtpCountdown";
import { errorMessage } from "../services/api";
import { requestContactChange, verifyContactChange } from "../services/contact-change";
import { showOtpCode } from "../services/otp-code";
import { OtpCodeReopenButton } from "./OtpCodeReopenButton";
import type { ContactField } from "../services/contact-change";

export function ContactChangeDialog({
  userId,
  field,
  currentValue,
  onClose,
  onSuccess,
}: {
  userId: number;
  field: ContactField | null;
  currentValue: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [value, setValue] = useState(currentValue);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"value" | "code">("value");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);
  const { remainingSeconds, resendInSeconds, expired, canResend, start, reset } = useOtpCountdown();

  useEffect(() => {
    setValue(currentValue);
    setCode("");
    setStep("value");
    setError("");
    setNotice("");
    reset();
  }, [currentValue, field, reset]);

  async function handleRequest() {
    if (!token || !field || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const policy = await requestContactChange(userId, field, value.trim(), token);
      setStep("code");
      setCode("");
      start(policy.expires_in, policy.resend_after);
      setNotice("Código enviado para o novo contato.");
      if (policy.demo_code) {
        showOtpCode({
          code: policy.demo_code,
          title: field === "phone" ? "Código do novo telefone" : "Código do novo e-mail",
          description: `Use este código para confirmar ${value.trim()}.`,
          expiresIn: policy.expires_in,
        });
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  async function handleVerify() {
    if (!token || !field || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await verifyContactChange(userId, field, value.trim(), code, token);
      reset();
      toast.success("Contato atualizado com sucesso");
      onSuccess();
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const label = field === "phone" ? "telefone" : "e-mail";

  return (
    <Dialog open={Boolean(field)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Alterar {label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
              {notice}
            </p>
          )}

          <div>
            <label htmlFor="contact-value" className="mb-1 block text-sm font-medium">
              Novo {label}
            </label>
            <input
              id="contact-value"
              type={field === "phone" ? "tel" : "email"}
              value={value}
              readOnly={step === "code"}
              disabled={pending}
              onChange={(event) => setValue(event.currentTarget.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          {step === "code" && (
            <div>
              <label htmlFor="contact-code" className="mb-1 block text-sm font-medium">
                Código de confirmação
              </label>
              <input
                id="contact-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                disabled={pending}
                onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>O código foi gerado.</span>
                <OtpCodeReopenButton />
              </div>
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

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            {step === "value" ? (
              <Button type="button" onClick={() => void handleRequest()} disabled={pending}>
                {pending ? "Enviando..." : "Enviar código"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRequest()}
                  disabled={pending || !canResend}
                >
                  {canResend
                    ? "Reenviar código"
                    : `Reenviar em ${formatCountdown(resendInSeconds)}`}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={pending || code.length !== 6 || expired}
                >
                  {pending ? "Confirmando..." : "Confirmar alteração"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
