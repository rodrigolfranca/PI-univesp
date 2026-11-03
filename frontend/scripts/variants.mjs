import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeConfig,
  validateManifests,
} from "../src/app/config/schema.mjs";
export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(
      `[${path.relative(projectRoot, file)}] JSON: ${error.message}`,
    );
  }
};
export function validateVariants(root = projectRoot) {
  const base = path.join(root, "src/variants");
  const folders = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  const manifests = folders.map((folder) => {
    const m = read(path.join(base, folder.name, "manifest.json"));
    if (m.id !== folder.name)
      throw new Error(
        `[${m.id}] manifest.id: deve corresponder à pasta ${folder.name}`,
      );
    return m;
  });
  validateManifests(manifests);
  const configs = manifests.map((m) => {
    const config = normalizeConfig(
      m,
      read(path.join(base, m.id, "config.json")),
    );
    const images = [
      ["identity.logo.public", config.identity.logo.public],
      ["identity.logo.dashboard", config.identity.logo.dashboard],
      ...config.catalog.gallery.map((g, i) => [
        `catalog.gallery[${i}].url`,
        g.url,
      ]),
    ];
    for (const [field, url] of images) {
      if (!url) continue;
      if (
        !url.startsWith(`/variants/${m.id}/`) ||
        url.includes("..") ||
        url.includes("\\") ||
        !fs
          .statSync(path.join(root, "public", url), { throwIfNoEntry: false })
          ?.isFile()
      )
        throw new Error(
          `[${m.id}] ${field}: imagem local inexistente ou fora de public/variants/${m.id}: ${url}`,
        );
    }
    return config;
  });
  const settings = read(path.join(base, "settings.json"));
  if (!manifests.some((m) => m.id === settings.defaultVariant))
    throw new Error(
      `[settings] defaultVariant: ID não cadastrado: ${settings.defaultVariant}`,
    );
  return configs;
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(`${validateVariants().length} variantes válidas.`);
