import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { USER_DIRECTORY } from "../config/users";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import type { ApiUser, UserFields, UserKind } from "../services/users";
import { normalizePhone } from "../services/users";
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
      {kind === "professional" && (
        <Link to="/app/settings" className="text-brand-700 underline">
          ← Voltar para Configurações
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
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
  const { users } = useUsers();
  const [search, setSearch] = useState("");
  const { title } = USER_DIRECTORY[kind];
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
      <DirectoryResults entries={filtered} kind={kind} hasQuery={Boolean(query)} />
    </>
  );
}

function DirectoryResults({
  entries,
  kind,
  hasQuery,
}: {
  entries: ApiUser[];
  kind: UserKind;
  hasQuery: boolean;
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
  return <UserTable entries={entries} kind={kind} />;
}

function UserTable({ entries, kind }: { entries: ApiUser[]; kind: UserKind }) {
  const { title, path } = USER_DIRECTORY[kind];
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{title} cadastrados</caption>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="p-4">
              Nome
            </th>
            <th scope="col" className="p-4">
              Contato
            </th>
            {kind === "professional" && (
              <th scope="col" className="p-4">
                Permissões
              </th>
            )}
            <th scope="col" className="p-4">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="p-4 font-medium">{entry.name}</td>
              <td className="p-4">
                <p>{entry.email}</p>
                <p>{entry.phone_number}</p>
              </td>
              {kind === "professional" && (
                <td className="p-4">
                  {entry.professional?.is_admin ? "Administrador" : "Profissional"}
                </td>
              )}
              <td className="p-4">
                <Link
                  to={`${path}/${entry.id}`}
                  className="text-brand-700 underline"
                  aria-label={`Ver detalhes de ${entry.name}`}
                >
                  Ver detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
