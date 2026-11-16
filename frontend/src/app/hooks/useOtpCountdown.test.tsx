import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useOtpCountdown } from "./useOtpCountdown";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useOtpCountdown", () => {
  it("conta validade e cooldown até a expiração", () => {
    const { result } = renderHook(() => useOtpCountdown());

    act(() => result.current.start(300, 90));

    expect(result.current.remainingSeconds).toBe(300);
    expect(result.current.resendInSeconds).toBe(90);
    expect(result.current.expired).toBe(false);
    expect(result.current.canResend).toBe(false);

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.remainingSeconds).toBe(299);
    expect(result.current.resendInSeconds).toBe(89);

    act(() => vi.advanceTimersByTime(89_000));

    expect(result.current.remainingSeconds).toBe(210);
    expect(result.current.resendInSeconds).toBe(0);
    expect(result.current.canResend).toBe(true);
    expect(result.current.expired).toBe(false);

    act(() => vi.advanceTimersByTime(210_000));

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.expired).toBe(true);

    act(() => result.current.reset());

    expect(result.current.expired).toBe(false);
    expect(result.current.canResend).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("formata segundos como mm:ss", () => {
    expect(formatCountdown(300)).toBe("05:00");
    expect(formatCountdown(59)).toBe("00:59");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
