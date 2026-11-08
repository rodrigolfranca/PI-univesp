import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { USER_DIRECTORY } from "../config/users";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import { useUserDetails } from "../hooks/useUserDetails";
import type { ApiUser, UserFields, UserKind } from "../services/users";
import { DeleteUserButton } from "./DeleteUserButton";
import { RequestState } from "./RequestState";
import { UserForm } from "./UserForm";
import { ClientHistory } from "./ClientHistory";
import { ContactChangeDialog } from "./ContactChangeDialog";
import type { ContactField } from "../services/contact-change";
import { Button } from "./ui/button";

export function UserDetails({ id, kind }: { id: number; kind: UserKind }) {
  const { user, loading, error, reload, setUser } = useUserDetails(id);
  const { title, path } = USER_DIRECTORY[kind];
  const ready = !loading && !error;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link to={path} className="text-brand-700 underline">
        ← Voltar para {title}
      </Link>
      <RequestState loading={loading} error={error} onRetry={reload} />
      {ready && user && (
        <LoadedUserDetails
          key={user.id}
          user={user}
          kind={kind}
          onUpdated={setUser}
          onReload={reload}
        />
      )}
    </div>
  );
}

interface LoadedUserDetailsProps {
  user: ApiUser;
  kind: UserKind;
  onUpdated: (user: ApiUser) => void;
  onReload: () => void;
}

function LoadedUserDetails({ user, kind, onUpdated, onReload }: LoadedUserDetailsProps) {
  const { user: currentUser } = useAuth();
  const { update } = useUsers();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [contactField, setContactField] = useState<ContactField | null>(null);
  const canEdit = Boolean(currentUser?.isAdmin || currentUser?.userId === user.id);
  const initialValues = { name: user.name, phone: user.phone_number, email: user.email };

  function handleEdit() {
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleSubmit(fields: UserFields) {
    onUpdated(await update(user.id, fields));
  }

  function handleSuccess() {
    setEditing(false);
    toast.success("Dados atualizados com sucesso.");
  }

  function handleDeleted() {
    const destination = currentUser?.userId === user.id ? "/login" : USER_DIRECTORY[kind].path;
    navigate(destination, { replace: true });
  }

  if (!user[kind]) {
    return <p>Este usuário não possui o perfil de {USER_DIRECTORY[kind].singular}.</p>;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Informações pessoais</h2>
        {editing ? (
          <UserForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            lockContact
          />
        ) : (
          <UserPersonalDetails
            user={user}
            canEdit={canEdit}
            canDelete={Boolean(currentUser?.isAdmin)}
            onEdit={handleEdit}
            onDeleted={handleDeleted}
            onChangeContact={setContactField}
          />
        )}
      </section>
      <ContactChangeDialog
        userId={user.id}
        field={contactField}
        currentValue={contactField === "phone" ? user.phone_number : user.email}
        onClose={() => setContactField(null)}
        onSuccess={onReload}
      />
      {kind === "client" && user.client && <ClientHistory clientId={user.client.id} />}
    </>
  );
}

interface UserPersonalDetailsProps {
  user: ApiUser;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDeleted: () => void;
  onChangeContact: (field: ContactField) => void;
}

function UserPersonalDetails({
  user,
  canEdit,
  canDelete,
  onEdit,
  onDeleted,
  onChangeContact,
}: UserPersonalDetailsProps) {
  return (
    <>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-gray-500">Nome</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Telefone</dt>
          <dd>{user.phone_number}</dd>
        </div>
        <div>
          <dt className="text-gray-500">E-mail</dt>
          <dd className="break-all">{user.email}</dd>
        </div>
        {user.professional && (
          <div>
            <dt className="text-gray-500">Permissões</dt>
            <dd>{user.professional.is_admin ? "Administrador" : "Profissional"}</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <>
            <Button type="button" onClick={onEdit}>
              Editar dados
            </Button>
            <Button type="button" variant="outline" onClick={() => onChangeContact("phone")}>
              Alterar telefone
            </Button>
            <Button type="button" variant="outline" onClick={() => onChangeContact("email")}>
              Alterar e-mail
            </Button>
          </>
        )}
        {canDelete && <DeleteUserButton user={user} onDeleted={onDeleted} />}
      </div>
    </>
  );
}
