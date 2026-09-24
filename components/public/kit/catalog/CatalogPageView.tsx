import Link from "next/link";
import { buildCatalogHref } from "@/src/foundation/cache/storefront-isr";
import { ProductCard } from "@/components/public/kit/product/ProductCard";
import { CatalogFilters } from "@/components/public/kit/catalog/CatalogFilters";
import { PaginationNav } from "@/components/ui/PaginationNav";
import {
  buildPageSizeSelectOptions,
  PAGE_SIZE_OPTIONS_PUBLIC,
} from "@/src/foundation/behaviors/catalog/pagination";
import type { CatalogPageModel } from "@/src/foundation/behaviors/view-models";

export type { CatalogViewQuery } from "@/src/foundation/behaviors/view-models";

/**
 * Shared catalog UI — receives a pre-built view-model (no storefront reads).
 * Callers choose ISR-friendly paths vs filtered `/catalogo/busca`.
 */
export function CatalogPageView({
  query,
  site,
  allCategories,
  facets,
  result,
  categoryOptions,
  hasFilters,
  countLabel,
  filterBase,
}: CatalogPageModel) {
  const paginas = site.textos.paginas;
  const catalogo = site.textos.catalogo;
  const produtoCopy = site.textos.produto;

  return (
    <div className="container catalog-page">
      <header className="catalog-page__head">
        <h1 className="vn-section-title catalog-page__title">
          {paginas.catalogoTitulo}
        </h1>
        <p className="catalog-page__count" aria-live="polite">
          {countLabel}
        </p>
      </header>

      <CatalogFilters
        categories={categoryOptions}
        facets={facets}
        allCategories={allCategories.map((c) => ({
          id: c.id,
          parentId: c.parentId,
          ativo: c.ativo,
        }))}
        q={query.q}
        categoria={query.categoria}
        tamanho={query.tamanho}
        cor={query.cor}
        labelCategoria={site.textos.catalogo.labelCategoria}
        buscaPlaceholder={site.textos.catalogo.buscaPlaceholder}
        dimensoes={site.rotulos.dimensoes}
      />

      {result.total === 0 ? (
        <div className="catalog-page__empty">
          <p>{catalogo.empty}</p>
          {hasFilters ? (
            <Link className="btn btn-primary" href="/catalogo">
              {catalogo.limparFiltros}
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid-products">
            {result.items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartEnabled={site.mostrarCarrinho}
                copy={produtoCopy}
              />
            ))}
          </div>
          <PaginationNav
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            label={paginas.catalogoTitulo}
            className="catalog-page__pagination"
            hrefForPage={(p) => buildCatalogHref({ ...filterBase, page: p })}
            pageSizeOptions={buildPageSizeSelectOptions(
              PAGE_SIZE_OPTIONS_PUBLIC,
              result.pageSize,
              (size) =>
                buildCatalogHref({
                  ...filterBase,
                  page: 1,
                  pageSize: size,
                }),
            )}
          />
        </>
      )}
    </div>
  );
}
