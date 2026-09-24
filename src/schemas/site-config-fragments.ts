import { z } from "zod";
import { isoDateSchema } from "./common";
import {
  siteComportamentoSchema,
  siteHexColorSchema,
  siteRotulosSchema,
  siteSeoSchema,
  siteTemaSchema,
  siteTextosCarrinhoSchema,
  siteTextosCatalogoSchema,
  siteTextosCookiesSchema,
  siteTextosHomeSchema,
  siteTextosLeadModalSchema,
  siteTextosPaginasSchema,
  siteTextosProdutoSchema,
  siteTextosRodapeSchema,
  siteVitrineSchema,
} from "@/src/schemas/site-personalization";
import { atelieLayoutConfigSchema } from "@/src/schemas/atelie-hero";
import {
  siteInstagramSchema,
  siteLayoutSchema,
  siteLogoInputSchema,
  siteLogoSchema,
} from "@/src/schemas/site-config";
import { DEFAULT_NAVEGACAO, siteNavegacaoSchema } from "@/src/schemas/navigation";
import { normalizeWhatsappTemplates } from "@/src/foundation/behaviors/whatsapp/wa-whatsapp-normalize";
import {
  cartWaTemplatePartsSchema,
  compactCartItemPartsSchema,
  productWaTemplatePartsSchema,
} from "@/src/foundation/behaviors/whatsapp/wa-template-validation";

export const siteConfigMetaSchema = z.object({
  versao: z.number().int().min(1),
  atualizadoEm: isoDateSchema,
});

export const siteGeralFragmentSchema = z.object({
  nomeLoja: z.string().min(1),
  mostrarNomeComLogo: z.boolean().default(false),
  mostrarCarrinho: z.boolean().default(true),
  assinatura: z.string().min(1),
  slogan: z.string().min(1),
  cores: z.object({
    primaria: siteHexColorSchema,
    secundaria: siteHexColorSchema,
    fundo: siteHexColorSchema,
    fundoNeutro: siteHexColorSchema,
    borda: siteHexColorSchema,
  }),
  logo: siteLogoSchema.nullable().optional(),
  metaReceitaMensal: z.number().min(0).nullable().default(null),
});

/** Geral write payload — logo may be pending upload. */
export const siteGeralUpdateSchema = siteGeralFragmentSchema
  .omit({ logo: true })
  .extend({
    logo: siteLogoInputSchema.nullable().optional(),
  });

export const siteWhatsappFragmentSchema = z.object({
  whatsapp: z
    .object({
      telefone: z.string().min(8),
      mensagemPadrao: z.string(),
      mensagemProdutoParts: productWaTemplatePartsSchema.optional(),
      mensagemProduto: z.string().optional(),
      mensagemProdutoIncluirReferencia: z.boolean().default(false),
      mensagemProdutoFormatoItens: z
        .enum(["produto", "compacto"])
        .default("produto"),
      mensagemProdutoItemCompactoParts: compactCartItemPartsSchema.optional(),
      mostrar: z.boolean().default(true),
      mensagemCarrinhoFormatoItens: z
        .enum(["produto", "compacto"])
        .default("produto"),
      mensagemCarrinhoParts: cartWaTemplatePartsSchema.optional(),
      mensagemCarrinho: z.string().optional(),
      mensagemCarrinhoItemCompactoParts: compactCartItemPartsSchema.optional(),
      mensagemCarrinhoItemCompacto: z.string().optional(),
    })
    .transform(normalizeWhatsappTemplates),
  comportamento: siteComportamentoSchema,
});

export const siteContatoFragmentSchema = z.object({
  instagram: siteInstagramSchema,
  endereco: z.object({
    cep: z.string().default(""),
    logradouro: z.string().default(""),
    numero: z.string().default(""),
    complemento: z.string().default(""),
    bairro: z.string().default(""),
    cidade: z.string(),
    uf: z.string(),
    texto: z.string(),
    mostrar: z.boolean().default(true),
  }),
  telefones: z
    .object({
      fixo: z.string().default(""),
      celular: z.string().default(""),
      usarWhatsappComoCelular: z.boolean().default(true),
      mostrarFixo: z.boolean().default(false),
      mostrarCelular: z.boolean().default(true),
    })
    .default({
      fixo: "",
      celular: "",
      usarWhatsappComoCelular: true,
      mostrarFixo: false,
      mostrarCelular: true,
    }),
  horarios: z.string(),
  /** Legacy owner of institutional copy; kept readable during migration. */
  textos: z
    .object({
      sobre: z.string(),
      trocas: z.string(),
    })
    .optional(),
});

export const siteVitrineFragmentSchema = z.object({
  layout: siteLayoutSchema.default("classic"),
  vitrine: siteVitrineSchema,
  atelie: atelieLayoutConfigSchema,
});

export const siteNavegacaoFragmentSchema = z.object({
  navegacao: siteNavegacaoSchema.default(DEFAULT_NAVEGACAO),
});

export const siteTextosFragmentSchema = z.object({
  textos: z.object({
    /** Optional when reading fragments created before copy moved from Contato. */
    sobre: z.string().optional(),
    trocas: z.string().optional(),
    paginas: siteTextosPaginasSchema,
    home: siteTextosHomeSchema,
    catalogo: siteTextosCatalogoSchema,
    produto: siteTextosProdutoSchema,
    rodape: siteTextosRodapeSchema,
    cookies: siteTextosCookiesSchema,
    leadModal: siteTextosLeadModalSchema,
    carrinho: siteTextosCarrinhoSchema,
  }),
  rotulos: siteRotulosSchema,
});

export const siteTemaFragmentSchema = z.object({
  tema: siteTemaSchema,
  seo: siteSeoSchema,
});

export const SITE_CONFIG_TAB_SCHEMAS = {
  geral: siteGeralFragmentSchema,
  whatsapp: siteWhatsappFragmentSchema,
  contato: siteContatoFragmentSchema,
  vitrine: siteVitrineFragmentSchema,
  navegacao: siteNavegacaoFragmentSchema,
  textos: siteTextosFragmentSchema,
  tema: siteTemaFragmentSchema,
} as const;

export type SiteConfigMeta = z.infer<typeof siteConfigMetaSchema>;
export type SiteGeralFragment = z.infer<typeof siteGeralFragmentSchema>;
export type SiteWhatsappFragment = z.infer<typeof siteWhatsappFragmentSchema>;
export type SiteContatoFragment = z.infer<typeof siteContatoFragmentSchema>;
export type SiteVitrineFragment = z.infer<typeof siteVitrineFragmentSchema>;
export type SiteNavegacaoFragment = z.infer<typeof siteNavegacaoFragmentSchema>;
export type SiteTextosFragment = z.infer<typeof siteTextosFragmentSchema>;
export type SiteTemaFragment = z.infer<typeof siteTemaFragmentSchema>;

export type SiteConfigTabFragment = {
  geral: SiteGeralFragment;
  whatsapp: SiteWhatsappFragment;
  contato: SiteContatoFragment;
  vitrine: SiteVitrineFragment;
  navegacao: SiteNavegacaoFragment;
  textos: SiteTextosFragment;
  tema: SiteTemaFragment;
};

export type SiteConfigFragments = {
  meta: SiteConfigMeta;
} & SiteConfigTabFragment;
