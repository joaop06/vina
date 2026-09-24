import "server-only";
import { waLink } from "@/src/foundation/behaviors/whatsapp/wa";
import {
  getCachedActiveBanners,
  getCachedActiveCategories,
  getCachedSiteConfig,
  listCachedProductListItems,
} from "@/src/foundation/cache/storefront-reads";
import type {
  Banner,
  Category,
  ProductListItem,
  SiteConfig,
} from "@/src/schemas";

export type HomePageModel = {
  site: SiteConfig;
  categories: Category[];
  banners: Banner[];
  destaques: ProductListItem[];
  novos: ProductListItem[];
  /** Public products shown when both destaques and novos are empty. */
  vitrineFallback: ProductListItem[];
  wa: string;
};

export async function getHomePageModel(): Promise<HomePageModel> {
  const site = await getCachedSiteConfig();
  const vitrine = site.vitrine;

  const [categories, banners, destaques, lancamentos, recentes] =
    await Promise.all([
      getCachedActiveCategories(),
      getCachedActiveBanners(),
      listCachedProductListItems({
        publicOnly: true,
        destaque: true,
        pageSize: vitrine.homeDestaquesLimit,
      }),
      listCachedProductListItems({
        publicOnly: true,
        lancamento: true,
        pageSize: vitrine.homeLancamentosFetchLimit,
      }),
      listCachedProductListItems({
        publicOnly: true,
        pageSize: vitrine.homeFallbackLimit,
      }),
    ]);

  // Produtos com ambas as flags ficam só em Destaques.
  const novos = lancamentos.items
    .filter((p) => p.lancamento && !p.destaque)
    .slice(0, vitrine.homeLancamentosLimit);
  const vitrineFallback =
    destaques.items.length === 0 && novos.length === 0
      ? recentes.items.slice(0, vitrine.homeFallbackLimit)
      : [];
  const wa = waLink(site.whatsapp.telefone, site.whatsapp.mensagemPadrao);

  return {
    site,
    categories,
    banners,
    destaques: destaques.items,
    novos,
    vitrineFallback,
    wa,
  };
}
