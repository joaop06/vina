import { z } from "zod";

/** Tab ids aligned with admin Configurações UI. */
export const SITE_CONFIG_TAB_IDS = [
  "geral",
  "whatsapp",
  "contato",
  "vitrine",
  "navegacao",
  "textos",
  "tema",
] as const;

export type SiteConfigTabId = (typeof SITE_CONFIG_TAB_IDS)[number];

export const siteConfigTabIdSchema = z.enum(SITE_CONFIG_TAB_IDS);

export const SITE_CONFIG_META_PATH = "configuracoes/meta.json";

export const SITE_CONFIG_TAB_PATHS: Record<SiteConfigTabId, string> = {
  geral: "configuracoes/geral.json",
  whatsapp: "configuracoes/whatsapp.json",
  contato: "configuracoes/contato.json",
  vitrine: "configuracoes/vitrine.json",
  navegacao: "configuracoes/navegacao.json",
  textos: "configuracoes/textos.json",
  tema: "configuracoes/tema.json",
};

export const SITE_CONFIG_FRAGMENT_PATHS = [
  SITE_CONFIG_META_PATH,
  ...Object.values(SITE_CONFIG_TAB_PATHS),
] as const;

/**
 * Tabs written on a partial update: patched tabs plus missing/invalid ones to heal.
 * Valid untouched tabs are left on disk (isolation between abas).
 */
export function siteConfigTabsToPersist(
  touched: Iterable<SiteConfigTabId>,
  fallbackTabs: Iterable<SiteConfigTabId> = [],
): SiteConfigTabId[] {
  return [...new Set([...touched, ...fallbackTabs])];
}
