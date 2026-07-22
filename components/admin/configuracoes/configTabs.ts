export type ConfiguracoesTabId =
  | "identidade"
  | "contato"
  | "whatsapp"
  | "vitrine"
  | "navegacao"
  | "painel";

export const CONFIGURACOES_TABS: Array<{
  id: ConfiguracoesTabId;
  label: string;
  /** Shorter label for narrow screens (CSS toggles visibility). */
  shortLabel?: string;
}> = [
    {
      id: "identidade",
      label: "Identidade",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      shortLabel: "WhatsApp",
    },
    {
      id: "contato",
      shortLabel: "Contato",
      label: "Contato e Endereço",
    },
    {
      id: "vitrine",
      shortLabel: "Vitrine",
      label: "Layout e Banners",
    },
    {
      id: "navegacao",
      label: "Navegação",
    },
    {
      id: "painel",
      label: "Painel",
    },
  ];

/** Map legacy `?tab=` values and current ids to a canonical tab. */
export function parseConfigTab(value: string | undefined): ConfiguracoesTabId {
  if (
    value === "contato" ||
    value === "whatsapp" ||
    value === "navegacao" ||
    value === "identidade" ||
    value === "painel"
  ) {
    return value;
  }
  if (
    value === "vitrine" ||
    value === "layout" ||
    value === "banners"
  ) {
    return "vitrine";
  }
  // Legacy Personalização tab
  if (value === "personalização" || value === "personalizacao") {
    return "identidade";
  }
  return "identidade";
}

export function configTabHref(tab: ConfiguracoesTabId): string {
  return tab === "identidade"
    ? "/admin/personalizacao"
    : `/admin/personalizacao?tab=${tab}`;
}
