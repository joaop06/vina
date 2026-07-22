import { CatalogPageView } from "@/components/public/CatalogPageView";
import { PAGINATION } from "@/src/lib/pagination";

export const metadata = { title: "Catálogo" };

/** Unfiltered page 1 — Full Route Cache / CDN (ISR). */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function CatalogoPage() {
  return (
    <CatalogPageView
      query={{
        page: 1,
        pageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
      }}
    />
  );
}
