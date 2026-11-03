export function whatsappLink(value: string) {
  const trimmed = value.trim();
  return !trimmed
    ? ""
    : /^https:\/\//i.test(trimmed)
      ? trimmed
      : `https://wa.me/${trimmed.replace(/\D/g, "")}`;
}
export function instagramLink(value: string) {
  return value.trim()
    ? `https://instagram.com/${value.trim().replace(/^@/, "")}`
    : "";
}
