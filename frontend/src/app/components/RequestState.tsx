import { Button } from "./ui/button";

export function RequestState({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="p-6 text-gray-600">
        Carregando...
      </p>
    );
  if (!error) return null;
  return (
    <div role="alert" className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{error}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
