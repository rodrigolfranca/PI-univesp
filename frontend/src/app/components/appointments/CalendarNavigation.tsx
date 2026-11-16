import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
export function CalendarNavigation({
  label,
  onPrevious,
  onNext,
  onToday,
  onSync,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSync?: () => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <button
        type="button"
        onClick={onToday}
        aria-label="Ir para hoje"
        title="Ir para hoje"
        className="flex cursor-pointer items-center gap-1.5 justify-self-start rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        <CalendarDays className="h-4 w-4" />
        Hoje
      </button>
      <div className="flex min-w-0 items-center justify-center gap-1 justify-self-center">
        <button
          type="button"
          aria-label="Período anterior"
          title="Período anterior"
          onClick={onPrevious}
          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <span className="min-w-0 text-center text-sm font-medium leading-tight text-gray-700">
          {label}
        </span>
        <button
          type="button"
          aria-label="Próximo período"
          title="Próximo período"
          onClick={onNext}
          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      {onSync && (
        <button
          type="button"
          onClick={onSync}
          className="flex cursor-pointer items-center gap-1.5 justify-self-end text-xs text-gray-400 transition-colors hover:text-blue-600"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>
      )}
    </div>
  );
}
