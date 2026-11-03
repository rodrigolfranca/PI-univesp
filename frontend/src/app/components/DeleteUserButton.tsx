import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUsers } from "../context/UsersContext";
import { errorMessage } from "../services/api";
import type { ApiUser } from "../services/users";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { RequestState } from "./RequestState";

export function DeleteUserButton({ user, onDeleted }: { user: ApiUser; onDeleted: () => void }) {
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

  return (
    <>
      <Button type="button" variant="destructive" onClick={handleOpen}>
        Excluir conta
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta de {user.name}?</DialogTitle>
            <DialogDescription>
              A conta será removida pelo servidor.{" "}
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
