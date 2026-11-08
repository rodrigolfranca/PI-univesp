import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { requestContactChange, verifyContactChange } from "../services/contact-change";
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

  useEffect(() => {
    setValue(currentValue);
    setCode("");
    setStep("value");
    setError("");
    setNotice("");
  }, [currentValue, field]);

  async function handleRequest() {
    if (!token || !field) return;
    setPending(true);
    setError("");
    try {
      await requestContactChange(userId, field, value.trim(), token);
      setStep("code");
      setNotice("Código enviado para o novo contato. Ele expira em cinco minutos.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleVerify() {
    if (!token || !field) return;
    setPending(true);
    setError("");
    try {
      await verifyContactChange(userId, field, value.trim(), code, token);
      toast.success("Contato atualizado com sucesso");
      onSuccess();
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
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
              <p className="mt-2 text-sm text-amber-800">
                O envio ainda é por log. Obtenha o código no terminal do backend.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            {step === "value" ? (
              <Button type="button" onClick={() => void handleRequest()} disabled={pending}>
                {pending ? "Enviando..." : "Enviar código"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleVerify()}
                disabled={pending || code.length !== 6}
              >
                {pending ? "Confirmando..." : "Confirmar alteração"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
