import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { cn } from "./ui/utils";

type BackButtonProps =
  | { to: string; onClick?: never; label?: string; className?: string }
  | { onClick: () => void; to?: never; label?: string; className?: string };

export function BackButton({ to, onClick, label = "Voltar", className }: BackButtonProps) {
  const classes = cn("flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4", className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        <ArrowLeft className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
