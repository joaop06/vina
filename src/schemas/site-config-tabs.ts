export * from "./site-config-paths";
export * from "./site-config-fragments";

import {
  siteConfigSchema,
  type SiteConfig,
} from "@/src/schemas/site-config";
import { DEFAULT_SITE_CONFIG } from "@/src/config/default-site-config";
import { DEFAULT_NAVEGACAO } from "@/src/schemas/navigation";
import type { SiteConfigTabId } from "./site-config-paths";
import {
  SITE_CONFIG_TAB_SCHEMAS,
  type SiteConfigFragments,
  type SiteConfigMeta,
  type SiteConfigTabFragment,
  type SiteContatoFragment,
  type SiteGeralFragment,
  type SiteNavegacaoFragment,
  type SiteTemaFragment,
  type SiteTextosFragment,
  type SiteVitrineFragment,
  type SiteWhatsappFragment,
} from "./site-config-fragments";

/** Split a full SiteConfig into on-disk fragments. */
export function splitSiteConfig(config: SiteConfig): SiteConfigFragments {
  return {
    meta: {
      versao: config.versao,
      atualizadoEm: config.atualizadoEm,
    },
    geral: {
      nomeLoja: config.nomeLoja,
      mostrarNomeComLogo: config.mostrarNomeComLogo,
      mostrarCarrinho: config.mostrarCarrinho,
      assinatura: config.assinatura,
      slogan: config.slogan,
      cores: config.cores,
      logo: config.logo ?? null,
      metaReceitaMensal: config.metaReceitaMensal ?? null,
    },
    whatsapp: {
      whatsapp: config.whatsapp,
      comportamento: config.comportamento,
    },
    contato: {
      instagram: config.instagram,
      endereco: config.endereco,
      telefones: config.telefones,
      horarios: config.horarios,
    },
    vitrine: {
      layout: config.layout,
      vitrine: config.vitrine,
      atelie: config.atelie,
    },
    navegacao: {
      navegacao: config.navegacao ?? DEFAULT_NAVEGACAO,
    },
    textos: {
      textos: {
        sobre: config.textos.sobre,
        trocas: config.textos.trocas,
        paginas: config.textos.paginas,
        home: config.textos.home,
        catalogo: config.textos.catalogo,
        produto: config.textos.produto,
        rodape: config.textos.rodape,
        cookies: config.textos.cookies,
        leadModal: config.textos.leadModal,
        carrinho: config.textos.carrinho,
      },
      rotulos: config.rotulos,
    },
    tema: {
      tema: config.tema,
      seo: config.seo,
    },
  };
}

/** Merge on-disk fragments into a raw object suitable for `siteConfigSchema`. */
export function composeSiteConfigRaw(fragments: SiteConfigFragments): unknown {
  const { meta, geral, whatsapp, contato, vitrine, navegacao, textos, tema } =
    fragments;
  return {
    versao: meta.versao,
    atualizadoEm: meta.atualizadoEm,
    ...geral,
    ...whatsapp,
    instagram: contato.instagram,
    endereco: contato.endereco,
    telefones: contato.telefones,
    horarios: contato.horarios,
    layout: vitrine.layout,
    vitrine: vitrine.vitrine,
    atelie: vitrine.atelie,
    navegacao: navegacao.navegacao,
    textos: {
      sobre:
        textos.textos.sobre ??
        contato.textos?.sobre ??
        DEFAULT_SITE_CONFIG.textos.sobre,
      trocas:
        textos.textos.trocas ??
        contato.textos?.trocas ??
        DEFAULT_SITE_CONFIG.textos.trocas,
      ...textos.textos,
    },
    rotulos: textos.rotulos,
    tema: tema.tema,
    seo: tema.seo,
  };
}

export function parseTabFragment<T extends SiteConfigTabId>(
  tab: T,
  raw: unknown,
): SiteConfigTabFragment[T] {
  return SITE_CONFIG_TAB_SCHEMAS[tab].parse(raw) as SiteConfigTabFragment[T];
}

/** Extract the tab slice from a full SiteConfig (for API responses). */
export function extractTabSlice<T extends SiteConfigTabId>(
  config: SiteConfig,
  tab: T,
): SiteConfigTabFragment[T] {
  const fragments = splitSiteConfig(config);
  return fragments[tab];
}

/** Merge a tab slice into a full SiteConfig (client-side hydrate). */
export function mergeTabIntoConfig(
  config: SiteConfig,
  tab: SiteConfigTabId,
  slice: SiteConfigTabFragment[SiteConfigTabId],
  meta?: Partial<SiteConfigMeta>,
): SiteConfig {
  const next = { ...config };
  if (meta?.versao != null) next.versao = meta.versao;
  if (meta?.atualizadoEm != null) next.atualizadoEm = meta.atualizadoEm;

  switch (tab) {
    case "geral": {
      const s = slice as SiteGeralFragment;
      return {
        ...next,
        nomeLoja: s.nomeLoja,
        mostrarNomeComLogo: s.mostrarNomeComLogo,
        mostrarCarrinho: s.mostrarCarrinho,
        assinatura: s.assinatura,
        slogan: s.slogan,
        cores: s.cores,
        logo: s.logo ?? null,
        metaReceitaMensal: s.metaReceitaMensal ?? null,
      };
    }
    case "whatsapp": {
      const s = slice as SiteWhatsappFragment;
      return {
        ...next,
        whatsapp: s.whatsapp,
        comportamento: s.comportamento,
      };
    }
    case "contato": {
      const s = slice as SiteContatoFragment;
      return {
        ...next,
        instagram: s.instagram,
        endereco: s.endereco,
        telefones: s.telefones,
        horarios: s.horarios,
        ...(s.textos
          ? {
              textos: {
                ...next.textos,
                sobre: s.textos.sobre,
                trocas: s.textos.trocas,
              },
            }
          : {}),
      };
    }
    case "vitrine": {
      const s = slice as SiteVitrineFragment;
      return {
        ...next,
        layout: s.layout,
        vitrine: s.vitrine,
        atelie: s.atelie,
      };
    }
    case "navegacao": {
      const s = slice as SiteNavegacaoFragment;
      return {
        ...next,
        navegacao: s.navegacao,
      };
    }
    case "textos": {
      const s = slice as SiteTextosFragment;
      return {
        ...next,
        textos: {
          ...next.textos,
          ...s.textos,
        },
        rotulos: s.rotulos,
      };
    }
    case "tema": {
      const s = slice as SiteTemaFragment;
      return {
        ...next,
        tema: s.tema,
        seo: s.seo,
      };
    }
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export type SiteConfigTabApiResponse<T extends SiteConfigTabId = SiteConfigTabId> = {
  tab: T;
  versao: number;
  atualizadoEm: string;
  data: SiteConfigTabFragment[T];
};

function fragmentsToConfig(fragments: SiteConfigFragments): SiteConfig {
  const parsed = siteConfigSchema.safeParse(composeSiteConfigRaw(fragments));
  if (!parsed.success) {
    console.warn(
      "[site-config] compose invalid, using defaults",
      parsed.error.flatten(),
    );
    return {
      ...DEFAULT_SITE_CONFIG,
      versao: fragments.meta.versao,
      atualizadoEm: fragments.meta.atualizadoEm,
    };
  }
  return parsed.data;
}

/**
 * Prefer tab fragments when present (canonical post-split storage).
 * Legacy `site.json` is only used when fragments have not been migrated yet.
 * Successful fragment writes delete the monolith so both never linger.
 */
export function pickSiteConfigSource(opts: {
  legacy: SiteConfig | null;
  fragments: SiteConfigFragments | null;
}): SiteConfig {
  if (opts.fragments) return fragmentsToConfig(opts.fragments);
  if (opts.legacy) return opts.legacy;
  return DEFAULT_SITE_CONFIG;
}
