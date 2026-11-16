import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { closeOtpCode, useOtpCodeNotice } from "../services/otp-code";

async function tryClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText && (await tryClipboard(value))) {
    return true;
  }

  try {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

export function OtpCodeModalHost() {
  const { current } = useOtpCodeNotice();

  async function handleCopy() {
    if (!current) return;
    const copied = await copyText(current.code);
    if (copied) {
      toast.success("Código copiado");
    } else {
      toast.error("Não foi possível copiar o código.");
    }
  }

  return (
    <Dialog open={Boolean(current)} onOpenChange={(open) => !open && closeOtpCode()}>
      <DialogContent className="z-[100] max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-brand-700" />
            {current?.title ?? "Código de verificação"}
          </DialogTitle>
          <DialogDescription>{current?.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-brand-100 bg-brand-50 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            Código de demonstração
          </p>
          <p
            data-testid="otp-code"
            className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-brand-800"
          >
            {current?.code}
          </p>
          {current?.expiresIn ? (
            <p className="mt-2 text-xs text-gray-500">
              Válido por {Math.max(1, Math.round(current.expiresIn / 60))} minutos.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" onClick={() => void handleCopy()}>
            <Copy className="h-4 w-4" />
            Copiar código
          </Button>
          <Button type="button" variant="outline" onClick={closeOtpCode}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
