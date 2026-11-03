import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSite, useStorageKey } from "../config/SiteContext";
import { migrateBrand } from "../config/schema.mjs";
import themes from "../config/themes.json";
import type { BrandConfig, Theme } from "../config/types";
export const COLOR_THEMES = themes;
export type { BrandConfig } from "../config/types";
interface BrandContextValue extends BrandConfig {
  updateBrand: (updates: Partial<BrandConfig>) => void;
}
const BrandContext = createContext<BrandContextValue | null>(null);
export function applyColorTheme(theme: Theme) {
  const palette = Object.keys(theme.palette).length
    ? theme.palette
    : themes.find((t) => t.id === theme.preset)!.vars;
  for (const [shade, color] of Object.entries(palette))
    document.documentElement.style.setProperty(`--brand-${shade}`, color);
  document.documentElement.style.setProperty("--primary", palette["600"]);
  document.documentElement.style.setProperty("--ring", palette["400"]);
}
export function BrandProvider({ children }: { children: ReactNode }) {
  const site = useSite(),
    key = useStorageKey("brand_config");
  const [config, setConfig] = useState<BrandConfig>(() => {
    const initial: BrandConfig = {
      name: site.identity.name,
      logoUrl: null,
      theme: site.theme,
      aboutTitle: site.content.homeAbout.title,
      aboutParagraphs: site.content.homeAbout.paragraphs,
      whatsappNumber: site.contact.whatsapp,
      instagramHandle: site.contact.instagram,
    };
    try {
      return migrateBrand(
        JSON.parse(localStorage.getItem(key) ?? "null"),
        initial,
      );
    } catch {
      return initial;
    }
  });
  useLayoutEffect(() => {
    applyColorTheme(config.theme);
    document.title = config.name;
  }, [config.theme, config.name]);
  function updateBrand(updates: Partial<BrandConfig>) {
    const next = { ...config, ...updates };
    localStorage.setItem(key, JSON.stringify(next));
    setConfig(next);
  }
  return (
    <BrandContext.Provider value={{ ...config, updateBrand }}>
      {children}
    </BrandContext.Provider>
  );
}
export function useBrand() {
  const value = useContext(BrandContext);
  if (!value) throw new Error("BrandProvider ausente");
  return value;
}
