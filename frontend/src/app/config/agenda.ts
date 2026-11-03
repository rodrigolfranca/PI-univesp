import type { SiteConfig } from "./types";
// Demonstration availability, not a server-backed reservation system.
export function demoOccupiedSlots(
  agenda: SiteConfig["agenda"],
  date: Date,
): string[] {
  const extra = [
    date.getDate() % 4 === 0 ? agenda.timeSlots[0] : null,
    date.getDate() % 5 === 0 ? agenda.timeSlots[2] : null,
    date.getDate() % 3 === 0 ? agenda.timeSlots[8] : null,
  ];
  return [
    ...new Set([
      ...agenda.blockedSlots,
      ...extra.filter((slot): slot is string => Boolean(slot)),
    ]),
  ];
}
