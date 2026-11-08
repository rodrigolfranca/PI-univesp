import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
export function CalendarNavigation({
  label,
  onPrevious,
  onNext,
  onToday,
  onSync,
  alignRight = false,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSync: () => void;
  alignRight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button
          aria-label="Período anterior"
          onClick={onPrevious}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
        >
          Hoje
        </button>
        <button
          aria-label="Próximo período"
          onClick={onNext}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <span className={`text-sm font-medium text-gray-700 ${alignRight ? "text-right" : ""}`}>
        {label}
      </span>
      <button
        onClick={onSync}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sincronizar</span>
      </button>
    </div>
  );
}
