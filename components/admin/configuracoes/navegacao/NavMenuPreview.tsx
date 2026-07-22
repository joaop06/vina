"use client";

import { resolveNavEntries } from "@/src/lib/navigation";
import type { NavSurfaceKey } from "@/src/lib/navigation-admin";
import type { Category } from "@/src/schemas/category";
import type { SiteNavegacao } from "@/src/schemas/navigation";

type Props = {
  nav: SiteNavegacao;
  surfaceKey: NavSurfaceKey;
  categories: Category[];
  /** Shown in preview context (e.g. store name on drawer). */
  storeLabel?: string;
};

export function NavMenuPreview({
  nav,
  surfaceKey,
  categories,
  storeLabel = "Sua loja",
}: Props) {
  const surface = nav[surfaceKey];
  const entries = resolveNavEntries(surface.itens, categories);
  const showTopbar =
    nav.topbar.mostrarEndereco || nav.topbar.mostrarTelefone;
  const isDrawer = surfaceKey === "drawer";

  return (
    <div
      className="admin-nav-v2__preview"
      aria-label={
        isDrawer
          ? "Prévia do menu do celular"
          : "Prévia do menu do cabeçalho"
      }
    >
      {showTopbar ? (
        <div className="admin-nav-v2__preview-topbar">
          {nav.topbar.mostrarEndereco ? (
            <span className="admin-nav-v2__preview-muted">Endereço</span>
          ) : null}
          {nav.topbar.mostrarTelefone ? (
            <span className="admin-nav-v2__preview-muted">Telefone</span>
          ) : null}
        </div>
      ) : null}

      {isDrawer ? (
        <div className="admin-nav-v2__preview-drawer">
          {nav.drawer.extras.mostrarTitulo ? (
            <div className="admin-nav-v2__preview-brand">{storeLabel}</div>
          ) : null}
          {nav.drawer.extras.mostrarAssinatura ? (
            <div className="admin-nav-v2__preview-muted admin-nav-v2__preview-tagline">
              Assinatura
            </div>
          ) : null}
          {surface.mostrarBusca ? (
            <div className="admin-nav-v2__preview-search">Buscar produtos…</div>
          ) : null}
          <ul className="admin-nav-v2__preview-links admin-nav-v2__preview-links--stack">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={
                  entry.kind === "categorias"
                    ? "admin-nav-v2__preview-link admin-nav-v2__preview-link--cat"
                    : "admin-nav-v2__preview-link"
                }
              >
                {entry.kind === "link" ? entry.label : "Categorias"}
              </li>
            ))}
          </ul>
          <div className="admin-nav-v2__preview-drawer-foot">
            {nav.drawer.extras.mostrarWhatsapp ? (
              <span>WhatsApp</span>
            ) : null}
            {nav.drawer.extras.mostrarInstagram ? (
              <span>Instagram</span>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-nav-v2__preview-header">
            <span className="admin-nav-v2__preview-logo" aria-hidden="true" />
            <ul className="admin-nav-v2__preview-links">
              {entries.map((entry) => (
                <li key={entry.id} className="admin-nav-v2__preview-link">
                  {entry.kind === "link" ? entry.label : "Categorias"}
                </li>
              ))}
            </ul>
            {surface.mostrarBusca ? (
              <span
                className="admin-nav-v2__preview-search-icon"
                aria-hidden="true"
              >
                🔍
              </span>
            ) : null}
          </div>
          <p className="admin-nav-v2__preview-muted admin-nav-v2__preview-hint">
            Em telas menores que 1024px, os links ficam no menu ☰; acima disso,
            aparecem na barra como na prévia.
          </p>
        </>
      )}
    </div>
  );
}
