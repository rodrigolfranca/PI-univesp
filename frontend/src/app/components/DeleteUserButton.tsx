import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import { errorMessage } from "../services/api";
import type { ApiUser } from "../services/users";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { RequestState } from "./RequestState";

export function DeleteUserButton({
  user,
  onDeleted,
  variant = "default",
}: {
  user: ApiUser;
  onDeleted: () => void;
  variant?: "default" | "icon";
}) {
  const { user: currentUser } = useAuth();
  const { remove } = useUsers();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await remove(user.id);
      toast.success("Conta excluída com sucesso.");
      setOpen(false);
      onDeleted();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  function handleOpen() {
    setError("");
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    if (!pending) setOpen(next);
  }

  function handleCancel() {
    setOpen(false);
  }

  function handleConfirm() {
    void confirm();
  }

  if (currentUser?.isAdmin && currentUser.userId === user.id) {
    return null;
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOpen();
          }}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
          title={`Excluir ${user.name}`}
          aria-label={`Excluir ${user.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <Button type="button" variant="destructive" onClick={handleOpen}>
          Excluir conta
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta de {user.name}?</DialogTitle>
            <DialogDescription>
              A conta será marcada como excluída e deixará de aparecer nas listas. Contas com
              agendamentos futuros não podem ser excluídas. O histórico de atendimentos será
              preservado.{" "}
              {user.client && user.professional
                ? "Esta conta possui vínculos de cliente e profissional; a exclusão afeta ambos."
                : "Esta ação afeta o acesso do usuário."}
            </DialogDescription>
          </DialogHeader>
          <RequestState error={error} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" disabled={pending} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
              {pending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
