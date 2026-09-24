import { notFound } from "next/navigation";
import {
  getCatalogPageModel,
  type CatalogViewQuery,
} from "@/src/foundation/behaviors/view-models";
import { CatalogPageView } from "@/components/public/kit/catalog/CatalogPageView";
import { getLayout } from "@/components/public/layouts";
import {
  CATALOG_STATIC_PAGE_LIMIT,
  parseCatalogPageParam,
} from "@/src/foundation/cache/storefront-isr";
import {
  getCachedProductIndex,
  getCachedSiteConfig,
} from "@/src/foundation/cache/storefront-reads";
import { filterProductIndexEntries } from "@/src/foundation/indices/product-index-core";
import { seoTitleFromTemplate } from "@/src/foundation/behaviors/copy/store-copy";
import { PAGINATION, totalPages } from "@/src/foundation/behaviors/catalog/pagination";

type Props = {
  params: Promise<{ page: string }>;
};

/** Paginated unfiltered browse — ISR + CDN. */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS
export const dynamicParams = true;

export async function generateMetadata() {
  const site = await getCachedSiteConfig();
  return {
    title: seoTitleFromTemplate(site, site.textos.paginas.catalogoTitulo),
  };
}

export async function generateStaticParams() {
  const index = await getCachedProductIndex();
  const publicCount = filterProductIndexEntries(index.entries, {
    publicOnly: true,
  }).length;
  const pages = totalPages(
    publicCount,
    PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
  );
  const last = Math.min(pages, CATALOG_STATIC_PAGE_LIMIT);
  // Page 1 lives at `/catalogo`; prebuild 2…last.
  const out: Array<{ page: string }> = [];
  for (let p = 2; p <= last; p++) {
    out.push({ page: String(p) });
  }
  return out;
}

export default async function CatalogoPagedPage({ params }: Props) {
  const { page: raw } = await params;
  const page = parseCatalogPageParam(raw);
  if (page == null || page < 2) notFound();

  const [index, site] = await Promise.all([
    getCachedProductIndex(),
    getCachedSiteConfig(),
  ]);
  const publicCount = filterProductIndexEntries(index.entries, {
    publicOnly: true,
  }).length;
  const pages = totalPages(
    publicCount,
    PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
  );
  if (page > pages) notFound();

  const { CatalogPage } = getLayout(site.layout);
  const query: CatalogViewQuery = {
    page,
    pageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
  };
  const model = await getCatalogPageModel(query);
  const Surface = CatalogPage ?? CatalogPageView;
  return <Surface {...model} />;
}
