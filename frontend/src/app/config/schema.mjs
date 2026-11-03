import defaults from "./defaults.json" with { type: "json" };
import themes from "./themes.json" with { type: "json" };
export const iconNames = [
  "briefcase",
  "calendar",
  "sparkles",
  "heart",
  "star",
  "award",
  "users",
  "droplet",
  "zap",
  "activity",
  "clock",
  "wrench",
  "scissors",
  "phone",
];
const shades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
export function normalizeHost(host) {
  return host.toLowerCase().replace(/\.$/, "");
}
function fail(id, field, message) {
  throw new Error(`[${id}] ${field}: ${message}`);
}
const card = { title: "", description: "", icon: "" };
const arrayItems = {
  "content.homeAbout.paragraphs": "",
  "content.about.paragraphs": "",
  "content.about.values": card,
  "content.treatments": card,
  "content.features": card,
  "contact.address": "",
  "contact.hours": "",
  "agenda.timeSlots": "",
  "agenda.blockedSlots": "",
  "catalog.categories": { id: 0, name: "" },
  "catalog.procedures": {
    id: 0,
    name: "",
    category: "",
    duration: "",
    price: "",
    status: "",
    description: "",
  },
  "catalog.gallery": { id: "", url: "", title: "" },
  "data.clientDocuments": {
    id: 0,
    name: "",
    uploadDate: "",
    size: "",
    url: "",
  },
  "data.procedureDocuments": {
    id: 0,
    name: "",
    uploadDate: "",
    size: "",
    url: "",
  },
  "data.clientAppointments": {
    id: "",
    procedure: "",
    date: "",
    time: "",
    status: "",
  },
  "data.clients": {
    id: 0,
    name: "",
    phone: "",
    email: "",
    lastVisit: "",
    status: "",
  },
  "data.appointments": {
    id: 0,
    client: "",
    procedure: "",
    date: "",
    time: "",
    status: "",
    durationMin: 0,
  },
  "data.employees": {
    id: 0,
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "",
  },
  "data.notifications": {
    id: 0,
    type: "",
    title: "",
    message: "",
    time: "",
    read: false,
  },
  "data.clientNotifications": {
    id: "",
    type: "",
    title: "",
    body: "",
    time: "",
    read: false,
  },
};
function check(value, model, id, field) {
  if (Array.isArray(model)) {
    if (!Array.isArray(value)) fail(id, field, "esperado um array");
    value.forEach((item, i) =>
      check(item, arrayItems[field], id, `${field}[${i}]`),
    );
  } else if (model && typeof model === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail(id, field, "esperado um objeto");
    if (field === "theme.palette") {
      for (const [shade, color] of Object.entries(value))
        if (
          !shades.includes(shade) ||
          typeof color !== "string" ||
          !/^#[\da-f]{6}$/i.test(color)
        )
          fail(id, field, "use tonalidades 50–900 com cores #RRGGBB");
      return;
    }
    for (const [key, item] of Object.entries(value)) {
      if (!Object.hasOwn(model, key))
        fail(id, `${field}.${key}`, "campo desconhecido");
      check(item, model[key], id, field ? `${field}.${key}` : key);
    }
  } else if (
    typeof value !== typeof model ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    fail(id, field, `esperado ${typeof model}`);
}
export function mergeDefaults(base, value) {
  if (Array.isArray(base))
    return value === undefined ? structuredClone(base) : structuredClone(value);
  if (base && typeof base === "object" && Object.keys(base).length === 0)
    return structuredClone(value ?? base);
  if (base && typeof base === "object")
    return Object.fromEntries(
      Object.keys(base).map((key) => [
        key,
        mergeDefaults(base[key], value?.[key]),
      ]),
    );
  return value === undefined ? base : value;
}
export function validateManifests(manifests) {
  const ids = new Set(),
    domains = new Set();
  for (const manifest of manifests) {
    const id = manifest?.id;
    if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      fail(id, "manifest.id", "use letras minúsculas, números e hífens");
    if (ids.has(id)) fail(id, "manifest.id", "ID duplicado");
    ids.add(id);
    if (!Array.isArray(manifest.domains) || !manifest.domains.length)
      fail(id, "manifest.domains", "informe pelo menos um domínio");
    for (const domain of manifest.domains) {
      if (
        typeof domain !== "string" ||
        !/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
      )
        fail(id, "manifest.domains", `domínio inválido: ${domain}`);
      const host = normalizeHost(domain);
      if (domains.has(host))
        fail(id, "manifest.domains", `domínio duplicado: ${domain}`);
      domains.add(host);
    }
  }
  return manifests;
}
export function normalizeConfig(manifest, raw) {
  const id = manifest.id;
  check(raw, defaults, id, "");
  if (!raw.identity?.name?.trim()) fail(id, "identity.name", "obrigatório");
  const config = mergeDefaults(defaults, raw);
  if (!["plain", "framed"].includes(config.identity.logo.presentation))
    fail(id, "identity.logo.presentation", "use plain ou framed");
  if (!themes.some((t) => t.id === config.theme.preset))
    fail(id, "theme.preset", "tema desconhecido");
  if (
    Object.keys(config.theme.palette).length &&
    shades.some((s) => !config.theme.palette[s])
  )
    fail(id, "theme.palette", "informe todas as tonalidades 50–900");
  for (const field of [
    "content.features",
    "content.treatments",
    "content.about.values",
  ]) {
    const cards = field.split(".").reduce((v, k) => v[k], config);
    cards.forEach((c, i) => {
      for (const prop of ["title", "description", "icon"])
        if (typeof c[prop] !== "string" || !c[prop].trim())
          fail(id, `${field}[${i}].${prop}`, "obrigatório");
      if (!iconNames.includes(c.icon))
        fail(id, `${field}[${i}].icon`, "ícone desconhecido");
    });
  }
  if (!iconNames.includes(config.catalog.icon))
    fail(id, "catalog.icon", "ícone desconhecido");
  for (const section of [
    "catalog.categories",
    "catalog.procedures",
    "catalog.gallery",
    ...Object.keys(config.data).map((k) => "data." + k),
  ]) {
    const list = section.split(".").reduce((v, k) => v[k], config),
      ids = new Set();
    const model = arrayItems[section];
    list.forEach((item, i) => {
      for (const key of Object.keys(model))
        if (key !== "title" && !(key in item))
          fail(id, `${section}[${i}].${key}`, "obrigatório");
      if (ids.has(item.id)) fail(id, `${section}[${i}].id`, "ID duplicado");
      ids.add(item.id);
    });
  }
  for (const field of ["timeSlots", "blockedSlots"])
    config.agenda[field].forEach((s, i) => {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))
        fail(id, `agenda.${field}[${i}]`, "use HH:MM");
    });
  if (
    config.agenda.blockedSlots.some((s) => !config.agenda.timeSlots.includes(s))
  )
    fail(id, "agenda.blockedSlots", "horário não está em timeSlots");
  for (const key of ["whatsapp", "instagram", "email", "phone"])
    if (typeof config.contact[key] !== "string")
      fail(id, `contact.${key}`, "esperado texto");
  if (
    config.contact.whatsapp &&
    !/^(\+?[\d ()-]+|https:\/\/wa\.me\/[^\s]+)$/.test(config.contact.whatsapp)
  )
    fail(id, "contact.whatsapp", "use número ou link https://wa.me/...");
  for (const [key, value] of Object.entries(config.terms))
    if (!value.trim()) fail(id, `terms.${key}`, "informe um termo não vazio");
  for (const [field, allowed] of [
    [
      "data.clientAppointments.status",
      ["confirmado", "pendente", "concluido", "cancelado"],
    ],
    [
      "data.clientNotifications.type",
      ["lembrete", "confirmacao", "cancelamento", "info"],
    ],
    ["data.appointments.status", ["Confirmado", "Pendente", "Cancelado"]],
  ]) {
    const [, list, key] = field.split(".");
    config.data[list].forEach((item, index) => {
      if (!allowed.includes(item[key]))
        fail(id, `data.${list}[${index}].${key}`, "valor inválido");
    });
  }
  return { ...config, ...manifest };
}
export function selectManifest(manifests, hostname, selected, fallback) {
  return (
    manifests.find((m) =>
      m.domains.some((d) => normalizeHost(d) === normalizeHost(hostname)),
    ) ??
    manifests.find((m) => m.id === (selected || fallback)) ??
    (() => {
      throw new Error(`Variante não cadastrada: ${selected || fallback}`);
    })()
  );
}
export function keyForSite(site, hostname, key) {
  return site.domains.some((d) => normalizeHost(d) === normalizeHost(hostname))
    ? key
    : `${site.id}:${key}`;
}
export function migrateBrand(stored, initial) {
  if (!stored || typeof stored !== "object" || Array.isArray(stored))
    return initial;
  const result = { ...initial };
  for (const key of ["name", "aboutTitle", "whatsappNumber", "instagramHandle"])
    if (typeof stored[key] === "string") result[key] = stored[key];
  if (stored.logoUrl === null || typeof stored.logoUrl === "string")
    result.logoUrl = stored.logoUrl;
  if (
    Array.isArray(stored.aboutParagraphs) &&
    stored.aboutParagraphs.every((p) => typeof p === "string")
  )
    result.aboutParagraphs = stored.aboutParagraphs;
  else if ([1, 2, 3].some((i) => `aboutParagraph${i}` in stored))
    result.aboutParagraphs = [1, 2, 3].map(
      (i) =>
        stored[`aboutParagraph${i}`] ?? initial.aboutParagraphs[i - 1] ?? "",
    );
  if (stored.theme) {
    try {
      const c = normalizeConfig(
        { id: "saved", domains: [] },
        { identity: { name: initial.name || "Site" }, theme: stored.theme },
      );
      result.theme = c.theme;
    } catch {}
  } else if (themes.some((t) => t.id === stored.colorThemeId))
    result.theme = { preset: stored.colorThemeId, palette: {} };
  return result;
}
export function translateTerms(text, terms) {
  const names = {
    serviços: "services",
    serviço: "service",
    tratamentos: "services",
    tratamento: "service",
    procedimentos: "procedures",
    procedimento: "procedure",
    clínica: "establishment",
    profissionais: "professionals",
    profissional: "professional",
  };
  return text.replace(
    /\b(serviços?|tratamentos?|procedimentos?|profissionais|profissional)\b|clínica/gi,
    (word) => {
      const value = terms[names[word.toLowerCase()]];
      return word === word.toUpperCase()
        ? value.toUpperCase()
        : word[0] === word[0].toUpperCase()
          ? value[0].toUpperCase() + value.slice(1)
          : value;
    },
  );
}
