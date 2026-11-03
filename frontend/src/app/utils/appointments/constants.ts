import type { AppStatus } from "../../config/types";
export const SLOT_HEIGHT = 52;
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
  Pendente: {
    block: "bg-amber-400 border-amber-500 text-amber-900",
    badge: "bg-yellow-100 text-yellow-700",
    chip: "bg-amber-400 text-amber-900",
  },
  Cancelado: {
    block: "bg-gray-300 border-gray-400 text-gray-600 line-through opacity-60",
    badge: "bg-red-100 text-red-700",
    chip: "bg-gray-300 text-gray-600 line-through opacity-60",
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

export const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];
