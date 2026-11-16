import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { USER_DIRECTORY } from "../config/users";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import { useUserDetails } from "../hooks/useUserDetails";
import type { ApiUser, UserKind } from "../services/users";
import { validateUser } from "../services/users";
import { errorMessage } from "../services/api";
import { BackButton } from "./BackButton";
import { DeleteUserButton } from "./DeleteUserButton";
import { RequestState } from "./RequestState";
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
      <BackButton to={path} label={`Voltar para ${title}`} />
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
  const [editName, setEditName] = useState(user.name);
  const [nameError, setNameError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [contactField, setContactField] = useState<ContactField | null>(null);
  const canEdit = Boolean(currentUser?.isAdmin || currentUser?.userId === user.id);

  function handleEdit() {
    setEditName(user.name);
    setNameError("");
    setSaveError("");
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setNameError("");
    setSaveError("");
  }

  function handleNameChange(name: string) {
    setEditName(name);
    if (nameError) setNameError("");
  }

  async function handleSave() {
    const fields = { name: editName, phone: user.phone_number, email: user.email };
    const errors = validateUser(fields);
    if (errors.name) {
      setNameError(errors.name);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      onUpdated(await update(user.id, fields));
      setEditing(false);
      toast.success("Dados atualizados com sucesso.");
    } catch (cause) {
      setSaveError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
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
        <UserPersonalDetails
          user={user}
          canEdit={canEdit}
          canDelete={Boolean(currentUser?.isAdmin)}
          editing={editing}
          editName={editName}
          nameError={nameError}
          saveError={saveError}
          saving={saving}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onNameChange={handleNameChange}
          onSave={() => void handleSave()}
          onDeleted={handleDeleted}
          onChangeContact={setContactField}
        />
      </section>
      {kind === "client" && user.client && <ClientHistory clientId={user.client.id} />}
      <ContactChangeDialog
        userId={user.id}
        field={contactField}
        currentValue={contactField === "phone" ? user.phone_number : user.email}
        onClose={() => setContactField(null)}
        onSuccess={onReload}
      />
    </>
  );
}

interface UserPersonalDetailsProps {
  user: ApiUser;
  canEdit: boolean;
  canDelete: boolean;
  editing: boolean;
  editName: string;
  nameError: string;
  saveError: string;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onDeleted: () => void;
  onChangeContact: (field: ContactField) => void;
}

function UserPersonalDetails({
  user,
  canEdit,
  canDelete,
  editing,
  editName,
  nameError,
  saveError,
  saving,
  onEdit,
  onCancel,
  onNameChange,
  onSave,
  onDeleted,
  onChangeContact,
}: UserPersonalDetailsProps) {
  return (
    <>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <label htmlFor="user-name" className="mb-1 block text-sm font-medium text-gray-500">
            Nome completo
          </label>
          <input
            id="user-name"
            type="text"
            value={editing ? editName : user.name}
            disabled={!editing}
            maxLength={150}
            aria-invalid={Boolean(nameError)}
            onChange={(event) => onNameChange(event.target.value)}
            className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              editing ? "bg-white text-gray-900" : "cursor-not-allowed bg-gray-100 text-gray-500"
            }`}
          />
          {nameError && <p className="mt-1 text-sm text-red-700">{nameError}</p>}
        </div>
        <div className="min-w-0">
          <label htmlFor="user-phone" className="mb-1 block text-sm font-medium text-gray-500">
            Telefone com DDD
          </label>
          <input
            id="user-phone"
            type="tel"
            value={user.phone_number}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="user-email" className="mb-1 block text-sm font-medium text-gray-500">
            E-mail
          </label>
          <input
            id="user-email"
            type="email"
            value={user.email}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500"
          />
        </div>
        {user.professional && (
          <div className="min-w-0">
            <label
              htmlFor="user-permissions"
              className="mb-1 block text-sm font-medium text-gray-500"
            >
              Permissões
            </label>
            <input
              id="user-permissions"
              type="text"
              value={user.professional.is_admin ? "Administrador" : "Profissional"}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500"
            />
          </div>
        )}
      </div>
      {editing && (
        <p className="text-sm text-gray-500">
          Telefone e e-mail só podem ser alterados pelos botões Alterar telefone/e-mail.
        </p>
      )}
      {saveError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {saveError}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {editing ? (
          <>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </>
        ) : (
          canEdit && (
            <Button type="button" onClick={onEdit}>
              Editar nome
            </Button>
          )
        )}
        {canEdit && (
          <>
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
