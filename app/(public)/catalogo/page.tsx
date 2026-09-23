import { CatalogPageView } from "@/components/public/CatalogPageView";
import { getLayout } from "@/components/public/layouts";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
import { seoTitleFromTemplate } from "@/src/lib/front/store-copy";
import { PAGINATION } from "@/src/lib/pagination";

/** Unfiltered page 1 — Full Route Cache / CDN (ISR). */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export async function generateMetadata() {
  const site = await getCachedSiteConfig();
  return {
    title: seoTitleFromTemplate(site, site.textos.paginas.catalogoTitulo),
  };
}

export default async function CatalogoPage() {
  const site = await getCachedSiteConfig();
  const { CatalogPage } = getLayout(site.layout);
  const query = {
    page: 1,
    pageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
  };
  if (CatalogPage) {
    return <CatalogPage query={query} />;
  }
  return <CatalogPageView query={query} />;
}
