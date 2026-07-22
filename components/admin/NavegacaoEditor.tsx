"use client";

import { useId, useState } from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import { NavMenuList } from "@/components/admin/configuracoes/navegacao/NavMenuList";
import { NavMenuPreview } from "@/components/admin/configuracoes/navegacao/NavMenuPreview";
import {
  copySurfaceItems,
  resetSurfaceToDefault,
  surfacesItemsDiffer,
  type NavSurfaceKey,
} from "@/src/lib/navigation-admin";
import {
  DEFAULT_NAVEGACAO,
  type NavItem,
  type SiteNavegacao,
} from "@/src/schemas/navigation";
import type { Category } from "@/src/schemas/category";

type Props = {
  value: SiteNavegacao;
  categories: Category[];
  storeLabel?: string;
  disabled?: boolean;
  onChange: (next: SiteNavegacao) => void;
};

function ensureNavegacao(value: SiteNavegacao | undefined): SiteNavegacao {
  return value ?? JSON.parse(JSON.stringify(DEFAULT_NAVEGACAO));
}

const SURFACES: Array<{
  id: NavSurfaceKey;
  label: string;
}> = [
  { id: "header", label: "Cabeçalho" },
  { id: "drawer", label: "Menu do celular" },
];

export function NavegacaoEditor({
  value,
  categories,
  storeLabel,
  disabled,
  onChange,
}: Props) {
  const nav = ensureNavegacao(value);
  const tabsId = useId();
  const [surfaceKey, setSurfaceKey] = useState<NavSurfaceKey>("header");
  const [copyIncludeSearch, setCopyIncludeSearch] = useState(false);
  const menusDiffer = surfacesItemsDiffer(nav);
  const otherSurface: NavSurfaceKey =
    surfaceKey === "header" ? "drawer" : "header";
  const otherLabel =
    otherSurface === "header" ? "cabeçalho" : "menu do celular";

  function patchSurface(
    key: NavSurfaceKey,
    patch: Partial<SiteNavegacao["header"]> & {
      extras?: SiteNavegacao["drawer"]["extras"];
    },
  ) {
    if (key === "header") {
      onChange({
        ...nav,
        header: {
          ...nav.header,
          ...patch,
          itens: patch.itens ?? nav.header.itens,
        },
      });
      return;
    }
    onChange({
      ...nav,
      drawer: {
        ...nav.drawer,
        ...patch,
        itens: patch.itens ?? nav.drawer.itens,
        extras: patch.extras ?? nav.drawer.extras,
      },
    });
  }

  function setItens(key: NavSurfaceKey, itens: NavItem[]) {
    patchSurface(key, { itens });
  }

  return (
    <div className="admin-nav-v2">
      <NavMenuPreview
        nav={nav}
        surfaceKey={surfaceKey}
        categories={categories}
        storeLabel={storeLabel}
      />

      <div className="admin-nav-v2__topbar">
        <span className="admin-field-label">
          Faixa superior (topo do site)
          <FieldHint text="Linha fina acima do cabeçalho com endereço e telefone cadastrados em Contato." />
        </span>
        <div className="admin-nav-v2__switch-row">
          <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
            <span>Endereço</span>
            <input
              type="checkbox"
              role="switch"
              checked={nav.topbar.mostrarEndereco}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...nav,
                  topbar: { ...nav.topbar, mostrarEndereco: e.target.checked },
                })
              }
            />
            <span className="admin-switch__track" aria-hidden="true" />
          </label>
          <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
            <span>Telefone</span>
            <input
              type="checkbox"
              role="switch"
              checked={nav.topbar.mostrarTelefone}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...nav,
                  topbar: { ...nav.topbar, mostrarTelefone: e.target.checked },
                })
              }
            />
            <span className="admin-switch__track" aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="admin-nav-v2__tabs dash-tabs">
        <div
          className="admin-nav-v2__tablist dash-tabs__list"
          role="tablist"
          aria-label="Onde editar o menu"
        >
          {SURFACES.map((tab) => {
            const active = surfaceKey === tab.id;
            const showDot = menusDiffer && !active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${tabsId}-tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`${tabsId}-panel-${tab.id}`}
                className={[
                  "dash-tabs__tab",
                  active ? "dash-tabs__tab--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSurfaceKey(tab.id)}
              >
                {tab.label}
                {showDot ? (
                  <span
                    className="admin-nav-v2__tab-dot"
                    title="Links diferentes do outro menu"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {SURFACES.map((tab) => {
          const active = surfaceKey === tab.id;
          const s = nav[tab.id];
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${tabsId}-panel-${tab.id}`}
              aria-labelledby={`${tabsId}-tab-${tab.id}`}
              hidden={!active}
              className="admin-nav-v2__panel dash-tabs__panel"
            >
              <div className="admin-nav-v2__options">
                <h3 className="admin-nav-v2__subsection">Opções deste menu</h3>
                <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
                  <span>Busca</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={s.mostrarBusca}
                    disabled={disabled}
                    onChange={(e) =>
                      patchSurface(tab.id, { mostrarBusca: e.target.checked })
                    }
                  />
                  <span className="admin-switch__track" aria-hidden="true" />
                </label>
                {tab.id === "drawer" ? (
                  <div className="admin-nav-v2__drawer-extras">
                    <span className="admin-field-label">Informações no menu</span>
                    <div className="admin-nav-v2__extras-grid">
                      <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
                        <span>Título da loja</span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={nav.drawer.extras.mostrarTitulo}
                          disabled={disabled}
                          onChange={(e) =>
                            patchSurface("drawer", {
                              extras: {
                                ...nav.drawer.extras,
                                mostrarTitulo: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="admin-switch__track" aria-hidden="true" />
                      </label>
                      <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
                        <span>Assinatura</span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={nav.drawer.extras.mostrarAssinatura}
                          disabled={disabled}
                          onChange={(e) =>
                            patchSurface("drawer", {
                              extras: {
                                ...nav.drawer.extras,
                                mostrarAssinatura: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="admin-switch__track" aria-hidden="true" />
                      </label>
                      <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
                        <span>WhatsApp no rodapé</span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={nav.drawer.extras.mostrarWhatsapp}
                          disabled={disabled}
                          onChange={(e) =>
                            patchSurface("drawer", {
                              extras: {
                                ...nav.drawer.extras,
                                mostrarWhatsapp: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="admin-switch__track" aria-hidden="true" />
                      </label>
                      <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
                        <span>Instagram no rodapé</span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={nav.drawer.extras.mostrarInstagram}
                          disabled={disabled}
                          onChange={(e) =>
                            patchSurface("drawer", {
                              extras: {
                                ...nav.drawer.extras,
                                mostrarInstagram: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="admin-switch__track" aria-hidden="true" />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="admin-nav-v2__links-section">
                <h3 className="admin-nav-v2__subsection">Links do menu</h3>
                <NavMenuList
                  surfaceKey={tab.id}
                  itens={s.itens}
                  categories={categories}
                  disabled={disabled}
                  onChange={(itens) => setItens(tab.id, itens)}
                />
              </div>

              {menusDiffer && active ? (
                <div className="admin-nav-v2__copy-banner" role="status">
                  <p>
                    Os links deste menu são diferentes do {otherLabel}.
                  </p>
                  <label className="admin-nav-v2__copy-opt">
                    <input
                      type="checkbox"
                      checked={copyIncludeSearch}
                      disabled={disabled}
                      onChange={(e) => setCopyIncludeSearch(e.target.checked)}
                    />
                    <span>Incluir opção de busca</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={disabled}
                    onClick={() =>
                      onChange(
                        copySurfaceItems(nav, otherSurface, tab.id, {
                          includeSearch: copyIncludeSearch,
                        }),
                      )
                    }
                  >
                    Copiar links do {otherLabel}
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className="btn btn-ghost btn-sm admin-nav-v2__reset"
                disabled={disabled}
                onClick={() =>
                  onChange(resetSurfaceToDefault(nav, tab.id))
                }
              >
                Restaurar menu padrão
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
