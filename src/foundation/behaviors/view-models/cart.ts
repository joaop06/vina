import "server-only";
import { getCachedSiteConfig } from "@/src/foundation/cache/storefront-reads";
import type { SiteConfig, SiteTextosExtended } from "@/src/schemas";

export type CartPageModel = {
  site: SiteConfig;
  cartEnabled: boolean;
  copy: SiteTextosExtended["carrinho"];
};

export async function getCartPageModel(): Promise<CartPageModel> {
  const site = await getCachedSiteConfig();
  return {
    site,
    cartEnabled: site.mostrarCarrinho,
    copy: site.textos.carrinho,
  };
}
