import { useSyncExternalStore } from "react";

export interface OtpCodeNotice {
  code: string;
  title: string;
  description: string;
  expiresIn?: number;
}

let current: OtpCodeNotice | null = null;
let last: OtpCodeNotice | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showOtpCode(notice: OtpCodeNotice) {
  current = notice;
  last = notice;
  emit();
}

export function closeOtpCode() {
  current = null;
  emit();
}

export function reopenOtpCode() {
  if (!last) return;
  current = last;
  emit();
}

export function resetOtpCode() {
  current = null;
  last = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCurrentSnapshot() {
  return current;
}

function getLastSnapshot() {
  return last;
}

export function useOtpCodeNotice() {
  const currentNotice = useSyncExternalStore(subscribe, getCurrentSnapshot, getCurrentSnapshot);
  const lastNotice = useSyncExternalStore(subscribe, getLastSnapshot, getLastSnapshot);

  return { current: currentNotice, last: lastNotice };
}
