import settings from "../../variants/settings.json";
import {
  normalizeConfig,
  selectManifest,
  validateManifests,
} from "./schema.mjs";
import type { Manifest, SiteConfig } from "./types";
const manifestModules = import.meta.glob("../../variants/*/manifest.json", {
  eager: true,
  import: "default",
});
const configModules = import.meta.glob("../../variants/*/config.json", {
  import: "default",
});
export async function loadSite(
  hostname: string,
  selected?: string,
): Promise<SiteConfig> {
  const manifests = validateManifests(
    Object.values(manifestModules),
  ) as Manifest[];
  const manifest = selectManifest(
    manifests,
    hostname,
    selected,
    settings.defaultVariant,
  ) as Manifest;
  const raw =
    await configModules[`../../variants/${manifest.id}/config.json`]();
  return normalizeConfig(manifest, raw) as SiteConfig;
}
