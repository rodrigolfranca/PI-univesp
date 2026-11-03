export function whatsappLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (/^https:\/\//i.test(trimmed)) return trimmed;

  return `https://wa.me/${trimmed.replace(/\D/g, "")}`;
}

export function instagramLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}
