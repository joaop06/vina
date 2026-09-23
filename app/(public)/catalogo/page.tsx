import {
  getCatalogPageModel,
  type CatalogViewQuery,
} from "@/src/foundation/behaviors/view-models";
import { CatalogPageView } from "@/components/public/kit/catalog/CatalogPageView";
import { getLayout } from "@/components/public/layouts";
import { getCachedSiteConfig } from "@/src/foundation/cache/storefront-reads";
import { seoTitleFromTemplate } from "@/src/foundation/behaviors/copy/store-copy";
import { PAGINATION } from "@/src/foundation/behaviors/catalog/pagination";

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
  const query: CatalogViewQuery = {
    page: 1,
    pageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
  };
  const model = await getCatalogPageModel(query);
  const Surface = CatalogPage ?? CatalogPageView;
  return <Surface {...model} />;
}
