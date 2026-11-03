import { useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { errorMessage } from "../services/api";
import { validateUser } from "../services/users";
import type { UserFields } from "../services/users";
import { RequestState } from "./RequestState";
import { Button } from "./ui/button";

interface UserFormProps {
  initialValues?: UserFields;
  onSubmit: (fields: UserFields) => Promise<unknown>;
  onSuccess?: () => void;
  onCancel?: () => void;
  onPendingChange?: (pending: boolean) => void;
  submitLabel?: string;
}

const EMPTY_USER: UserFields = { name: "", phone: "", email: "" };
const FIELDS = [
  { name: "name", label: "Nome completo", type: "text", autoComplete: "name" },
  { name: "phone", label: "Telefone com DDD", type: "tel", autoComplete: "tel-national" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
] as const;

export function UserForm({
  initialValues = EMPTY_USER,
  onSubmit,
  onSuccess,
  onCancel,
  onPendingChange,
  submitLabel = "Salvar alterações",
}: UserFormProps) {
  const id = useId();
  const [fields, setFields] = useState<UserFields>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFields, string>>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validateUser(fields);
    setErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    setPending(true);
    onPendingChange?.(true);
    try {
      await onSubmit(fields);
      onSuccess?.();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
      onPendingChange?.(false);
    }
  }

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof UserFields;
    const value = event.currentTarget.value;
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <fieldset disabled={pending} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`${id}-${field.name}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {field.label}
            </label>
            <input
              id={`${id}-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              value={fields[field.name]}
              required
              maxLength={field.name === "name" ? 150 : undefined}
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={errors[field.name] ? `${id}-${field.name}-error` : undefined}
              onChange={handleFieldChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            />
            {errors[field.name] && (
              <p id={`${id}-${field.name}-error`} className="mt-1 text-sm text-red-700">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
      </fieldset>
      <RequestState error={error} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
