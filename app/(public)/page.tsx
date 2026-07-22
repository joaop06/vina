import {
  getCachedActiveBanners,
  getCachedActiveCategories,
  getCachedSiteConfig,
  listCachedProductListItems,
} from "@/src/lib/cache/storefront-reads";
import { getLayout } from "@/components/public/layouts";
import { waLink } from "@/src/lib/wa";

/** Home — Full Route Cache / CDN (ISR). Sections use index pageSize limits. */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function HomePage() {
  const [site, categories, banners, destaques, lancamentos, recentes] =
    await Promise.all([
      getCachedSiteConfig(),
      getCachedActiveCategories(),
      getCachedActiveBanners(),
      listCachedProductListItems({
        publicOnly: true,
        destaque: true,
        pageSize: 8,
      }),
      listCachedProductListItems({
        publicOnly: true,
        lancamento: true,
        pageSize: 16,
      }),
      listCachedProductListItems({ publicOnly: true, pageSize: 8 }),
    ]);

  // Produtos com ambas as flags ficam só em Destaques.
  const novos = lancamentos.items
    .filter((p) => p.lancamento && !p.destaque)
    .slice(0, 8);
  const vitrineFallback =
    destaques.items.length === 0 && novos.length === 0
      ? recentes.items.slice(0, 8)
      : [];
  const wa = waLink(site.whatsapp.telefone, site.whatsapp.mensagemPadrao);
  const { Home } = getLayout(site.layout);

  return (
    <Home
      site={site}
      categories={categories}
      banners={banners}
      destaques={destaques.items}
      novos={novos}
      vitrineFallback={vitrineFallback}
      wa={wa}
    />
  );
}
