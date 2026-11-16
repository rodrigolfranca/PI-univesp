import { useCallback, useEffect, useState } from "react";

interface OtpTimers {
  expiresAt: number;
  resendAt: number;
}

export interface OtpCountdown {
  remainingSeconds: number;
  resendInSeconds: number;
  expired: boolean;
  canResend: boolean;
  start: (expiresIn: number, resendAfter: number) => void;
  reset: () => void;
}

export function useOtpCountdown(): OtpCountdown {
  const [timers, setTimers] = useState<OtpTimers | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const start = useCallback((expiresIn: number, resendAfter: number) => {
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) return;
    if (!Number.isFinite(resendAfter) || resendAfter < 0) return;

    const startedAt = Date.now();
    setNow(startedAt);
    setTimers({
      expiresAt: startedAt + expiresIn * 1000,
      resendAt: startedAt + resendAfter * 1000,
    });
  }, []);

  const reset = useCallback(() => setTimers(null), []);

  useEffect(() => {
    if (!timers) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timers]);

  const remainingSeconds = timers ? Math.max(0, Math.ceil((timers.expiresAt - now) / 1000)) : 0;
  const resendInSeconds = timers ? Math.max(0, Math.ceil((timers.resendAt - now) / 1000)) : 0;

  return {
    remainingSeconds,
    resendInSeconds,
    expired: Boolean(timers) && remainingSeconds === 0,
    canResend: Boolean(timers) && resendInSeconds === 0,
    start,
    reset,
  };
}

export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
