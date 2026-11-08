import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { MockDocument, UserMock } from "../hooks/useUserMock";
import type { UserKind } from "../services/users";
import { RequestState } from "./RequestState";
import { Button } from "./ui/button";

interface UserMockDetailsProps {
  data: UserMock;
  save: (patch: Partial<UserMock>) => void;
  kind: UserKind;
  canEdit: boolean;
}

export function UserMockDetails({ data, save, kind, canEdit }: UserMockDetailsProps) {
  const [error, setError] = useState("");

  function saveMock(patch: Partial<UserMock>) {
    try {
      save(patch);
      setError("");
    } catch {
      setError("Não foi possível salvar os dados demonstrativos neste navegador.");
    }
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    saveMock({ status: event.currentTarget.value });
  }

  function handleRoleChange(event: ChangeEvent<HTMLInputElement>) {
    saveMock({ role: event.currentTarget.value });
  }

  function handleDocumentsChange(documents: MockDocument[]) {
    saveMock({ documents });
  }

  return (
    <section className="space-y-4 rounded-xl border border-amber-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Complementos demonstrativos</h2>
      <p className="text-sm text-amber-800">
        Estes dados são mock e ficam apenas neste navegador. Não são enviados ao servidor.
      </p>
      <RequestState error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mock-status" className="mb-1 block text-sm">
            Status demonstrativo
          </label>
          <select
            id="mock-status"
            disabled={!canEdit}
            value={data.status}
            onChange={handleStatusChange}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
        {kind === "professional" && (
          <div>
            <label htmlFor="mock-role" className="mb-1 block text-sm">
              Cargo demonstrativo
            </label>
            <input
              id="mock-role"
              disabled={!canEdit}
              value={data.role}
              onChange={handleRoleChange}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}
        {kind === "client" && (
          <p className="text-sm">Última visita demonstrativa: {data.lastVisit}</p>
        )}
      </div>
      {kind === "client" && (
        <MockClientDocuments
          documents={data.documents}
          canEdit={canEdit}
          onChange={handleDocumentsChange}
        />
      )}
    </section>
  );
}

interface MockClientDocumentsProps {
  documents: MockDocument[];
  canEdit: boolean;
  onChange: (documents: MockDocument[]) => void;
}

function MockClientDocuments({ documents, canEdit, onChange }: MockClientDocumentsProps) {
  const [documentName, setDocumentName] = useState("");

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setDocumentName(event.currentTarget.value);
  }

  function handleRemove(id: string) {
    onChange(documents.filter((document) => document.id !== id));
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentName.trim()) return;
    onChange([...documents, { id: crypto.randomUUID(), name: documentName.trim() }]);
    setDocumentName("");
  }

  return (
    <>
      {/* TODO(integracao): conectar documentos quando houver endpoints; esta lista não realiza upload. */}
      <h3 className="font-medium">Documentos demonstrativos</h3>
      <MockDocumentList documents={documents} canEdit={canEdit} onRemove={handleRemove} />
      {canEdit && (
        <form className="space-y-2" onSubmit={handleAdd}>
          <label htmlFor="mock-document-name" className="block text-sm">
            Nome do documento de exemplo
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="mock-document-name"
              required
              value={documentName}
              onChange={handleNameChange}
              className="rounded-lg border px-3 py-2"
            />
            <Button type="submit" variant="outline">
              Adicionar exemplo
            </Button>
          </div>
        </form>
      )}
      {/* TODO(integracao): buscar atendimentos pelo ID de cliente quando a agenda for integrada. */}
      <h3 className="font-medium">Histórico demonstrativo</h3>
      <p className="text-sm text-gray-500">
        Nenhum atendimento vinculado. A agenda ainda não foi integrada a esta conta.
      </p>
    </>
  );
}

interface MockDocumentListProps {
  documents: MockDocument[];
  canEdit: boolean;
  onRemove: (id: string) => void;
}

function MockDocumentList({ documents, canEdit, onRemove }: MockDocumentListProps) {
  if (!documents.length)
    return <p className="text-sm text-gray-500">Nenhum documento demonstrativo.</p>;
  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <MockDocumentItem
          key={document.id}
          document={document}
          canEdit={canEdit}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}

function MockDocumentItem({
  document,
  canEdit,
  onRemove,
}: {
  document: MockDocument;
  canEdit: boolean;
  onRemove: (id: string) => void;
}) {
  function handleRemove() {
    onRemove(document.id);
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>{document.name}</span>
      {canEdit && (
        <Button type="button" variant="outline" onClick={handleRemove}>
          Remover exemplo
        </Button>
      )}
    </li>
  );
}
