import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useSite, useStorageKey } from "../config/SiteContext";
import { migrateBrand } from "../config/schema.mjs";
import themes from "../config/themes.json";
import type { BrandConfig, Theme } from "../config/types";
import { getSiteBrand, updateSiteBrand } from "../services/site";

export const COLOR_THEMES = themes;

export type { BrandConfig } from "../config/types";

interface BrandContextValue extends BrandConfig {
  updateBrand: (updates: Partial<BrandConfig>) => Promise<void>;
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
  const site = useSite();
  const { token, user } = useAuth();
  const key = useStorageKey("brand_config");
  const initial: BrandConfig = {
    name: site.identity.name,
    logoUrl: null,
    theme: site.theme,
    aboutTitle: site.content.homeAbout.title,
    aboutParagraphs: site.content.homeAbout.paragraphs,
    whatsappNumber: site.contact.whatsapp,
    instagramHandle: site.contact.instagram,
  };
  const [config, setConfig] = useState<BrandConfig>(initial);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    function readLegacy() {
      try {
        return migrateBrand(JSON.parse(localStorage.getItem(key) ?? "null"), initial);
      } catch {
        return initial;
      }
    }

    async function load() {
      try {
        const remote = await getSiteBrand(controller.signal);
        if (!active) return;
        if (remote) {
          setConfig(remote);
          localStorage.removeItem(key);
          return;
        }
        const fallback = readLegacy();
        setConfig(fallback);
        if (token && user?.isAdmin) {
          const saved = await updateSiteBrand(fallback, token);
          if (!active) return;
          setConfig(saved);
          localStorage.removeItem(key);
        }
      } catch {
        if (active) setConfig(readLegacy());
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token, user?.isAdmin]);

  useLayoutEffect(() => {
    applyColorTheme(config.theme);
    document.title = config.name;
  }, [config.theme, config.name]);

  async function updateBrand(updates: Partial<BrandConfig>) {
    if (!token) throw new Error("Entre na sua conta para salvar as alterações.");
    const next = { ...config, ...updates };
    const saved = await updateSiteBrand(next, token);
    localStorage.removeItem(key);
    setConfig(saved);
  }

  return (
    <BrandContext.Provider value={{ ...config, updateBrand }}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const value = useContext(BrandContext);
  if (!value) throw new Error("BrandProvider ausente");

  return value;
}
