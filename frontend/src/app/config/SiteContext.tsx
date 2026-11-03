import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SiteConfig } from "./types";
import { keyForSite, translateTerms } from "./schema.mjs";

const SiteContext = createContext<SiteConfig | null>(null);

export function SiteProvider({ site, children }: { site: SiteConfig; children: ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const site = useContext(SiteContext);
  if (!site) throw new Error("SiteProvider ausente");

  return site;
}

export function useStorageKey(key: string) {
  return keyForSite(useSite(), window.location.hostname, key) as string;
}

export function useTerminology() {
  const { terms } = useSite();

  return (text: string) => translateTerms(text, terms) as string;
}
