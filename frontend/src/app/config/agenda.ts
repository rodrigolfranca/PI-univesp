import type { SiteConfig } from "./types";

// A disponibilidade é demonstrativa; não há reserva no servidor.
export function demoOccupiedSlots(agenda: SiteConfig["agenda"], date: Date): string[] {
  const extra = [
    date.getDate() % 4 === 0 ? agenda.timeSlots[0] : null,
    date.getDate() % 5 === 0 ? agenda.timeSlots[2] : null,
    date.getDate() % 3 === 0 ? agenda.timeSlots[8] : null,
  ];

  return [
    ...new Set([...agenda.blockedSlots, ...extra.filter((slot): slot is string => Boolean(slot))]),
  ];
}
