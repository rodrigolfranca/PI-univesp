import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Briefcase, Pencil, UserRound } from "lucide-react";
import { toast } from "sonner";
import { USER_DIRECTORY } from "../config/users";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import type { ApiUser, UserFields, UserKind } from "../services/users";
import { normalizePhone } from "../services/users";
import { DeleteUserButton } from "./DeleteUserButton";
import { UserForm } from "./UserForm";
import { ProfessionalClientsList } from "./ProfessionalClientsList";
import { RequestState } from "./RequestState";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function UserDirectory({ kind }: { kind: UserKind }) {
  const { user } = useAuth();
  const { loading, create } = useUsers();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { title, singular } = USER_DIRECTORY[kind];

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!saving) setOpen(next);
  }

  function handleCreate(fields: UserFields) {
    return create(kind, fields);
  }

  function handleSuccess() {
    setOpen(false);
    toast.success("Cadastro realizado com sucesso.");
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            Gerencie os cadastros de {title.toLowerCase()}
          </p>
        </div>
        {user?.isAdmin && (
          <Button type="button" disabled={loading} onClick={handleOpen}>
            Cadastrar {singular}
          </Button>
        )}
      </div>
      {user?.isAdmin ? (
        <AdminUserList kind={kind} />
      ) : kind === "client" ? (
        <ProfessionalClientsList />
      ) : (
        <RestrictedProfileNotice />
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar {singular}</DialogTitle>
            <DialogDescription>
              Informe os dados da nova conta.
              {kind === "professional" &&
                " O profissional será cadastrado sem privilégios de administrador."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            key={String(open)}
            onPendingChange={setSaving}
            onSubmit={handleCreate}
            submitLabel="Cadastrar"
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RestrictedProfileNotice() {
  return (
    <section className="space-y-2 rounded-xl border bg-white p-6">
      <h2 className="font-semibold">Acesso restrito</h2>
      <p>A listagem de usuários é exclusiva de administradores.</p>
      <p>Edite seu próprio perfil nas configurações.</p>
    </section>
  );
}

function AdminUserList({ kind }: { kind: UserKind }) {
  const { users, update } = useUsers();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const { title, singular } = USER_DIRECTORY[kind];
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const digits = normalizePhone(query);
  const filtered = users.filter(
    (entry) =>
      entry[kind] &&
      (!query ||
        entry.name.toLocaleLowerCase("pt-BR").includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        (digits.length > 0 && entry.phone_number.includes(digits))),
  );

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.currentTarget.value);
  }

  function handleEditSubmit(fields: UserFields) {
    if (!editUser) throw new Error("Usuário não selecionado.");
    return update(editUser.id, fields);
  }

  function handleEditSuccess() {
    setEditUser(null);
    toast.success("Dados atualizados com sucesso.");
  }

  return (
    <>
      <div>
        <label htmlFor="user-search" className="mb-1 block text-sm font-medium">
          Buscar {title.toLowerCase()}
        </label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder="Nome, e-mail ou telefone"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
        />
      </div>
      <DirectoryResults
        entries={filtered}
        kind={kind}
        hasQuery={Boolean(query)}
        onEdit={setEditUser}
      />
      <Dialog
        open={Boolean(editUser)}
        onOpenChange={(next) => {
          if (!next && !editSaving) setEditUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {singular}</DialogTitle>
            <DialogDescription>
              Atualize o nome. Telefone e e-mail são alterados pelos botões específicos na página de
              detalhes.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <UserForm
              key={editUser.id}
              initialValues={{
                name: editUser.name,
                phone: editUser.phone_number,
                email: editUser.email,
              }}
              onSubmit={handleEditSubmit}
              onPendingChange={setEditSaving}
              onCancel={() => setEditUser(null)}
              onSuccess={handleEditSuccess}
              lockContact
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DirectoryResults({
  entries,
  kind,
  hasQuery,
  onEdit,
}: {
  entries: ApiUser[];
  kind: UserKind;
  hasQuery: boolean;
  onEdit: (entry: ApiUser) => void;
}) {
  const { loading, error, reload } = useUsers();
  const { singular } = USER_DIRECTORY[kind];
  if (loading || error) return <RequestState loading={loading} error={error} onRetry={reload} />;
  if (!entries.length) {
    const message = hasQuery
      ? "Nenhum resultado para esta busca."
      : `Nenhum ${singular} cadastrado.`;
    return <p className="rounded-xl border bg-white p-6">{message}</p>;
  }
  return <UserList entries={entries} kind={kind} onEdit={onEdit} />;
}

function UserList({
  entries,
  kind,
  onEdit,
}: {
  entries: ApiUser[];
  kind: UserKind;
  onEdit: (entry: ApiUser) => void;
}) {
  const { path } = USER_DIRECTORY[kind];
  const navigate = useNavigate();
  const Icon = kind === "client" ? UserRound : Briefcase;

  function openDetails(entry: ApiUser) {
    navigate(`${path}/${entry.id}`);
  }

  const columns =
    kind === "professional"
      ? "md:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_140px_104px]"
      : "md:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_104px]";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div
        className={`hidden items-center gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid ${columns}`}
      >
        <span>Nome</span>
        <span>Contato</span>
        {kind === "professional" && <span>Permissões</span>}
        <span className="text-right">Ações</span>
      </div>
      <div className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-50 md:gap-4 md:px-6 ${columns}`}
            onClick={() => openDetails(entry)}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <Icon className="h-4 w-4 text-brand-600" />
                </span>
                <Link
                  to={`${path}/${entry.id}`}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Ver detalhes de ${entry.name}`}
                  className="min-w-0 truncate font-medium text-gray-900 transition-colors hover:text-brand-700"
                >
                  {entry.name}
                </Link>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500 md:hidden">
                {entry.email} · {entry.phone_number}
              </p>
              {kind === "professional" && (
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium md:hidden ${
                    entry.professional?.is_admin
                      ? "bg-brand-100 text-brand-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {entry.professional?.is_admin ? "Administrador" : "Profissional"}
                </span>
              )}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-gray-900">{entry.email}</p>
              <p className="text-gray-500">{entry.phone_number}</p>
            </div>
            {kind === "professional" && (
              <div className="hidden md:block">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.professional?.is_admin
                      ? "bg-brand-100 text-brand-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {entry.professional?.is_admin ? "Administrador" : "Profissional"}
                </span>
              </div>
            )}
            <div
              className="flex flex-shrink-0 items-center justify-end gap-1"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 rounded-lg"
                title={`Editar ${entry.name}`}
                aria-label={`Editar ${entry.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <DeleteUserButton user={entry} variant="icon" onDeleted={() => undefined} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
