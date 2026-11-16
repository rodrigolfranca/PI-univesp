import { KeyRound } from "lucide-react";
import { reopenOtpCode, useOtpCodeNotice } from "../services/otp-code";

export function OtpCodeReopenButton({ className = "" }: { className?: string }) {
  const { last } = useOtpCodeNotice();
  if (!last) return null;

  return (
    <button
      type="button"
      onClick={reopenOtpCode}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2 ${className}`}
    >
      <KeyRound className="h-3.5 w-3.5" />
      Ver código novamente
    </button>
  );
}
