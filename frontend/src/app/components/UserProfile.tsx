import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import type { UserFields } from "../services/users";
import { UserForm } from "./UserForm";
import { Button } from "./ui/button";

export function UserProfile() {
  const { user, logout } = useAuth();
  const { update } = useUsers();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  function handleEdit() {
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleSubmit(fields: UserFields) {
    if (!user) throw new Error("Entre na sua conta para continuar.");
    return update(user.userId, fields);
  }

  function handleSuccess() {
    setEditing(false);
    toast.success("Perfil atualizado com sucesso.");
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;
  const initialValues = { name: user.name, phone: user.phone, email: user.email };

  return (
    <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 md:p-6">
      <h2 className="text-xl font-semibold">Meu perfil</h2>
      {editing ? (
        <UserForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      ) : (
        <ProfileSummary user={user} onEdit={handleEdit} />
      )}
      <Button type="button" variant="outline" onClick={handleLogout}>
        Sair da conta
      </Button>
    </section>
  );
}

function ProfileSummary({ user, onEdit }: { user: AuthUser; onEdit: () => void }) {
  const permissionLabel = getPermissionLabel(user);
  return (
    <>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-gray-500">Nome</dt>
          <dd className="font-medium">{user.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Telefone</dt>
          <dd>{user.phone}</dd>
        </div>
        <div>
          <dt className="text-gray-500">E-mail</dt>
          <dd className="break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Permissões</dt>
          <dd>{permissionLabel}</dd>
        </div>
      </dl>
      <Button type="button" onClick={onEdit}>
        Editar perfil
      </Button>
    </>
  );
}

function getPermissionLabel(user: AuthUser): string {
  if (user.isAdmin) return "Administrador";
  if (user.role === "employee") return "Profissional";
  return "Cliente";
}
