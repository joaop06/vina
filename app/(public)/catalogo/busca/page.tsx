import { CatalogPageView } from "@/components/public/CatalogPageView";
import {
  firstSearchParam,
  normalizePagination,
  PAGINATION,
} from "@/src/lib/pagination";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Catálogo" };

/**
 * Filtered / search catalog. Uses searchParams → dynamic render in Next 15,
 * but loaders hit the product index (cheap miss). Prefer `/catalogo` +
 * `/catalogo/page/N` for unfiltered browse (ISR).
 */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function CatalogoBuscaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoria = firstSearchParam(sp.categoria);
  const tamanho = firstSearchParam(sp.tamanho);
  const cor = firstSearchParam(sp.cor);
  const q = firstSearchParam(sp.q);
  const { page, pageSize } = normalizePagination(
    {
      page: firstSearchParam(sp.page),
      pageSize: firstSearchParam(sp.pageSize),
    },
    { defaultPageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE },
  );

  return (
    <CatalogPageView
      query={{ page, pageSize, q, categoria, tamanho, cor }}
    />
  );
}
