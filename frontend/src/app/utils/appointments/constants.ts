import type { AppStatus } from "../../config/types";
export const SLOT_MINUTES = 15;
export const SLOT_HEIGHT = 26;
export const DAY_START = 9;
export const DAY_END = 18;

export const STATUS_STYLE: Record<
  AppStatus,
  {
    block: string;
    badge: string;
    chip: string;
  }
> = {
  Confirmado: {
    block: "bg-brand-600 border-brand-700 text-white",
    badge: "bg-green-100 text-green-700",
    chip: "bg-brand-600 text-white",
  },
  Concluído: {
    block: "bg-emerald-100 border-emerald-500 text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800",
    chip: "bg-emerald-100 text-emerald-800",
  },
  Cancelado: {
    block: "bg-gray-300 border-gray-400 text-gray-600 line-through opacity-60",
    badge: "bg-red-100 text-red-700",
    chip: "bg-gray-300 text-gray-600 line-through opacity-60",
  },
  Ausente: {
    block: "bg-orange-100 border-orange-400 text-orange-800",
    badge: "bg-orange-100 text-orange-800",
    chip: "bg-orange-100 text-orange-800",
  },
};
export const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const WEEK_DAYS_LONG = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
