import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import type { UserFields } from "../services/users";
import { UserForm } from "./UserForm";
import { ContactChangeDialog } from "./ContactChangeDialog";
import type { ContactField } from "../services/contact-change";
import { Button } from "./ui/button";

export function UserProfile() {
  const { user, logout, retrySession } = useAuth();
  const { update } = useUsers();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [contactField, setContactField] = useState<ContactField | null>(null);

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
          lockContact
        />
      ) : (
        <ProfileSummary user={user} onEdit={handleEdit} onChangeContact={setContactField} />
      )}
      <Button type="button" variant="outline" onClick={handleLogout}>
        Sair da conta
      </Button>
      <ContactChangeDialog
        userId={user.userId}
        field={contactField}
        currentValue={contactField === "phone" ? user.phone : user.email}
        onClose={() => setContactField(null)}
        onSuccess={retrySession}
      />
    </section>
  );
}

function ProfileSummary({
  user,
  onEdit,
  onChangeContact,
}: {
  user: AuthUser;
  onEdit: () => void;
  onChangeContact: (field: ContactField) => void;
}) {
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
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onEdit}>
          Editar perfil
        </Button>
        <Button type="button" variant="outline" onClick={() => onChangeContact("phone")}>
          Alterar telefone
        </Button>
        <Button type="button" variant="outline" onClick={() => onChangeContact("email")}>
          Alterar e-mail
        </Button>
      </div>
    </>
  );
}

function getPermissionLabel(user: AuthUser): string {
  if (user.isAdmin) return "Administrador";
  if (user.role === "employee") return "Profissional";
  return "Cliente";
}
