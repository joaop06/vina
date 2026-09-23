import "server-only";
import {
  getCachedProductBySlug,
  getCachedSiteConfig,
} from "@/src/foundation/cache/storefront-reads";
import { getSiteUrl } from "@/src/foundation/platform/env";
import type {
  Product,
  SiteDimensao,
  SiteTextosExtended,
} from "@/src/schemas";
import type { CompactCartItemParts } from "@/src/foundation/behaviors/whatsapp/wa-compact-template";
import type { ProductWaTemplateParts } from "@/src/foundation/behaviors/whatsapp/wa-product-template";

export type ProductDetailModel = {
  product: Product;
  productCopy: SiteTextosExtended["produto"];
  dimensoes: SiteDimensao[];
  whatsappCurto: string;
  waPhone: string;
  waProductParts: ProductWaTemplateParts;
  waIncluirReferencia?: boolean;
  waProdutoFormatoItens?: "produto" | "compacto";
  waProdutoItemCompactoParts?: CompactCartItemParts;
  showWhatsApp?: boolean;
  initialTamanho?: string;
  initialCor?: string;
  initialQuantidade?: number;
  siteUrl?: string;
  mostrarCarrinho?: boolean;
};

export async function getProductDetailModel(
  slug: string,
): Promise<ProductDetailModel | null> {
  const [product, site] = await Promise.all([
    getCachedProductBySlug(slug),
    getCachedSiteConfig(),
  ]);
  if (!product) return null;

  return {
    product,
    productCopy: site.textos.produto,
    dimensoes: site.rotulos.dimensoes,
    whatsappCurto: site.textos.home.whatsappCurto,
    waPhone: site.whatsapp.telefone,
    waProductParts: site.whatsapp.mensagemProdutoParts,
    waIncluirReferencia: Boolean(
      site.whatsapp.mensagemProdutoIncluirReferencia,
    ),
    waProdutoFormatoItens:
      site.whatsapp.mensagemProdutoFormatoItens ?? "produto",
    waProdutoItemCompactoParts:
      site.whatsapp.mensagemProdutoItemCompactoParts,
    showWhatsApp: site.whatsapp.mostrar,
    siteUrl: getSiteUrl(),
    mostrarCarrinho: site.mostrarCarrinho,
  };
}
