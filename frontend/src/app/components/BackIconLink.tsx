import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function BackIconLink({ to = "/", onClick }: { to?: string; onClick?: () => void }) {
  const className =
    "absolute left-4 top-4 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900";

  if (onClick) {
    return (
      <button type="button" aria-label="Voltar" onClick={onClick} className={className}>
        <ArrowLeft className="h-5 w-5" />
      </button>
    );
  }

  return (
    <Link to={to} aria-label="Voltar" className={className}>
      <ArrowLeft className="h-5 w-5" />
    </Link>
  );
}
