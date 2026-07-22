import type { ImageMeta } from "@/components/admin/ImageField";
import { syncInstagram } from "@/src/lib/instagram";
import { normalizeWaDigits } from "@/src/lib/wa";
import { DEFAULT_COMPACT_CART_ITEM_PARTS } from "@/src/lib/wa-compact-template";
import { DEFAULT_NAVEGACAO } from "@/src/schemas/navigation";
import type { SiteConfig } from "@/src/schemas/site-config";

export function normalizeSiteConfig(initial: SiteConfig): SiteConfig {
  return {
    ...initial,
    layout: initial.layout ?? "classic",
    mostrarNomeComLogo: initial.mostrarNomeComLogo ?? false,
    mostrarCarrinho: initial.mostrarCarrinho ?? true,
    navegacao: initial.navegacao ?? structuredClone(DEFAULT_NAVEGACAO),
    endereco: {
      ...initial.endereco,
      cep: initial.endereco.cep ?? "",
      logradouro: initial.endereco.logradouro ?? "",
      numero: initial.endereco.numero ?? "",
      complemento: initial.endereco.complemento ?? "",
      bairro: initial.endereco.bairro ?? "",
      mostrar: initial.endereco.mostrar ?? true,
    },
    telefones: {
      fixo: initial.telefones?.fixo ?? "",
      celular: initial.telefones?.celular ?? "",
      usarWhatsappComoCelular:
        initial.telefones?.usarWhatsappComoCelular ?? true,
      mostrarFixo: initial.telefones?.mostrarFixo ?? false,
      mostrarCelular: initial.telefones?.mostrarCelular ?? true,
    },
    instagram: syncInstagram(initial.instagram),
    painel: {
      metaReceitaMensal: initial.painel?.metaReceitaMensal ?? null,
    },
    whatsapp: {
      ...initial.whatsapp,
      mensagemProdutoFormatoItens:
        initial.whatsapp.mensagemProdutoFormatoItens ?? "produto",
      mensagemProdutoItemCompactoParts:
        initial.whatsapp.mensagemProdutoItemCompactoParts ??
        DEFAULT_COMPACT_CART_ITEM_PARTS,
      mensagemCarrinhoFormatoItens:
        initial.whatsapp.mensagemCarrinhoFormatoItens ?? "produto",
      mensagemCarrinhoItemCompactoParts:
        initial.whatsapp.mensagemCarrinhoItemCompactoParts ??
        DEFAULT_COMPACT_CART_ITEM_PARTS,
    },
  };
}

export function logoFromConfig(config: SiteConfig): ImageMeta | null {
  if (!config.logo) return null;
  return {
    id: config.logo.id,
    path: config.logo.path,
    alt: config.logo.alt,
  };
}

/** Stable fingerprint for dirty comparison (ignores versao / atualizadoEm). */
export function configFingerprint(
  config: SiteConfig,
  logo: ImageMeta | null,
): string {
  return JSON.stringify({
    nomeLoja: config.nomeLoja,
    mostrarNomeComLogo: Boolean(config.mostrarNomeComLogo),
    mostrarCarrinho: Boolean(config.mostrarCarrinho),
    assinatura: config.assinatura,
    slogan: config.slogan,
    layout: config.layout ?? "classic",
    cores: config.cores,
    whatsapp: {
      telefone: normalizeWaDigits(config.whatsapp.telefone),
      mensagemPadrao: config.whatsapp.mensagemPadrao,
      mensagemProdutoParts: config.whatsapp.mensagemProdutoParts,
      mensagemProdutoIncluirReferencia: Boolean(
        config.whatsapp.mensagemProdutoIncluirReferencia,
      ),
      mensagemProdutoFormatoItens:
        config.whatsapp.mensagemProdutoFormatoItens ?? "produto",
      mensagemProdutoItemCompactoParts:
        config.whatsapp.mensagemProdutoItemCompactoParts,
      mostrar: Boolean(config.whatsapp.mostrar),
      mensagemCarrinhoFormatoItens:
        config.whatsapp.mensagemCarrinhoFormatoItens ?? "produto",
      mensagemCarrinhoParts: config.whatsapp.mensagemCarrinhoParts,
      mensagemCarrinhoItemCompactoParts:
        config.whatsapp.mensagemCarrinhoItemCompactoParts,
    },
    instagram: syncInstagram({
      handle: config.instagram.handle,
      mostrar: Boolean(config.instagram.mostrar),
    }),
    endereco: {
      cep: config.endereco.cep ?? "",
      logradouro: config.endereco.logradouro ?? "",
      numero: config.endereco.numero ?? "",
      complemento: config.endereco.complemento ?? "",
      bairro: config.endereco.bairro ?? "",
      texto: config.endereco.texto,
      cidade: config.endereco.cidade,
      uf: config.endereco.uf,
      mostrar: Boolean(config.endereco.mostrar),
    },
    telefones: {
      fixo: normalizeWaDigits(config.telefones.fixo),
      celular: normalizeWaDigits(config.telefones.celular),
      usarWhatsappComoCelular: Boolean(
        config.telefones.usarWhatsappComoCelular,
      ),
      mostrarFixo: Boolean(config.telefones.mostrarFixo),
      mostrarCelular: Boolean(config.telefones.mostrarCelular),
    },
    horarios: config.horarios,
    textos: config.textos,
    navegacao: config.navegacao ?? DEFAULT_NAVEGACAO,
    painel: {
      metaReceitaMensal: config.painel?.metaReceitaMensal ?? null,
    },
    logo: logo
      ? {
          id: logo.id,
          path: logo.path,
          alt: logo.alt ?? "",
          pending: Boolean(logo.file),
        }
      : null,
  });
}
