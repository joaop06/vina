import "server-only";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getFilterCategoryIds,
} from "@/src/foundation/behaviors/catalog/categories-tree";
import type { CompactCatalogFacets } from "@/src/foundation/behaviors/catalog/catalog-facets";
import type { PaginatedResult } from "@/src/foundation/behaviors/catalog/pagination";
import { PAGINATION } from "@/src/foundation/behaviors/catalog/pagination";
import { catalogoContagemLabel } from "@/src/foundation/behaviors/copy/store-copy";
import {
  getCachedActiveCategories,
  getCachedAllCategories,
  getCachedPublicCatalogFacets,
  getCachedSiteConfig,
  listCachedProductListItems,
} from "@/src/foundation/cache/storefront-reads";
import type { Category, ProductListItem, SiteConfig } from "@/src/schemas";

export type CatalogViewQuery = {
  page: number;
  pageSize: number;
  q?: string;
  categoria?: string;
  tamanho?: string;
  cor?: string;
};

export type CatalogCategoryOption = {
  id: string;
  slug: string;
  nome: string;
  depth: number;
  parentId: string | null;
};

export type CatalogFilterBase = {
  pageSize: number;
  q?: string;
  categoria?: string;
  tamanho?: string;
  cor?: string;
  defaultPageSize: number;
};

export type CatalogPageModel = {
  query: CatalogViewQuery;
  site: SiteConfig;
  categories: Category[];
  allCategories: Category[];
  facets: CompactCatalogFacets;
  result: PaginatedResult<ProductListItem>;
  categoryOptions: CatalogCategoryOption[];
  hasFilters: boolean;
  countLabel: string;
  filterBase: CatalogFilterBase;
};

export async function getCatalogPageModel(
  query: CatalogViewQuery,
): Promise<CatalogPageModel> {
  const { page, pageSize, q, categoria, tamanho, cor } = query;

  const [categories, allCategories, facets, site] = await Promise.all([
    getCachedActiveCategories(),
    getCachedAllCategories(),
    getCachedPublicCatalogFacets({ q }),
    getCachedSiteConfig(),
  ]);

  let filterIds: string[] | null = null;
  if (categoria) {
    const match = categories.find(
      (c) => c.slug === categoria || c.id === categoria,
    );
    if (match) {
      filterIds = getFilterCategoryIds(match.id, allCategories);
    } else {
      filterIds = [];
    }
  }

  const result = await listCachedProductListItems({
    publicOnly: true,
    categoriaIds: filterIds ?? undefined,
    tamanho,
    cor,
    q,
    page,
    pageSize,
  });

  const hasFilters = Boolean(q || categoria || tamanho || cor);

  const categoryOptions = flattenCategoryTree(
    buildCategoryTree(categories),
  ).map(({ category: c, depth }) => ({
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    depth,
    parentId: c.parentId,
  }));

  return {
    query,
    site,
    categories,
    allCategories,
    facets,
    result,
    categoryOptions,
    hasFilters,
    countLabel: catalogoContagemLabel(site, result.total),
    filterBase: {
      pageSize,
      q,
      categoria,
      tamanho,
      cor,
      defaultPageSize: PAGINATION.PUBLIC_DEFAULT_PAGE_SIZE,
    },
  };
}
