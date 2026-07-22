import { DEFAULT_COMPACT_CART_ITEM_PARTS } from "@/src/lib/wa-compact-template";
import { DEFAULT_CART_WA_TEMPLATE_PARTS } from "@/src/lib/wa-cart-template";
import { DEFAULT_PRODUCT_WA_TEMPLATE_PARTS } from "@/src/lib/wa-product-template";
import { DEFAULT_NAVEGACAO } from "@/src/schemas/navigation";
import type { SiteConfig } from "@/src/schemas/site-config";

/** Canonical defaults for new installs and `data/configuracoes/site.json` seed. */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  versao: 1,
  nomeLoja: "Minha loja",
  mostrarNomeComLogo: false,
  mostrarCarrinho: true,
  assinatura: "Catálogo online",
  slogan: "Configure sua vitrine no painel admin e comece a vender pelo WhatsApp.",
  layout: "classic",
  cores: {
    primaria: "#111111",
    secundaria: "#111111",
    fundo: "#FFFFFF",
    fundoNeutro: "#F5F5F5",
    borda: "#E5E5E5",
  },
  logo: null,
  whatsapp: {
    telefone: "11999999999",
    mensagemPadrao: "Olá! Vim pelo site e gostaria de saber mais.",
    mensagemProdutoParts: DEFAULT_PRODUCT_WA_TEMPLATE_PARTS,
    mensagemProdutoIncluirReferencia: false,
    mensagemProdutoFormatoItens: "produto",
    mensagemProdutoItemCompactoParts: DEFAULT_COMPACT_CART_ITEM_PARTS,
    mostrar: true,
    mensagemCarrinhoFormatoItens: "produto",
    mensagemCarrinhoParts: DEFAULT_CART_WA_TEMPLATE_PARTS,
    mensagemCarrinhoItemCompactoParts: DEFAULT_COMPACT_CART_ITEM_PARTS,
  },
  instagram: {
    handle: "",
    url: "",
    mostrar: false,
  },
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    texto: "",
    mostrar: false,
  },
  telefones: {
    fixo: "",
    celular: "",
    usarWhatsappComoCelular: true,
    mostrarFixo: false,
    mostrarCelular: true,
  },
  horarios: "Seg–Sex 9h–18h · Sáb 9h–13h",
  textos: {
    sobre:
      "Apresente sua loja aqui. Edite este texto em Admin → Personalização → Identidade.",
    trocas:
      "Consulte nossa equipe pelo WhatsApp para trocas e devoluções.",
  },
  navegacao: DEFAULT_NAVEGACAO,
  painel: { metaReceitaMensal: null },
  atualizadoEm: "2026-01-01T00:00:00.000Z",
};
