"use client";

import { BannersClient } from "@/components/admin/BannersClient";
import { LayoutPreview } from "@/components/admin/configuracoes/siteTheme";
import { SITE_LAYOUT_OPTIONS } from "@/components/public/layouts/options";
import type { Banner } from "@/src/schemas/banner";
import type { SiteConfig, SiteLayoutId } from "@/src/schemas/site-config";

export function VitrinePanel({
  formId,
  config,
  baselineLayout,
  primaryColor,
  initialBanners,
  disabled,
  onSubmit,
  onConfigChange,
}: {
  formId: string;
  config: SiteConfig;
  baselineLayout: SiteLayoutId;
  primaryColor: string;
  initialBanners: Banner[];
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const selectedLayout = config.layout ?? "classic";
  const layoutDraft = selectedLayout !== baselineLayout;

  return (
    <div className="admin-config-vitrine">
      <form
        id={formId}
        onSubmit={onSubmit}
        className={[
          "admin-form",
          "admin-form--sections",
          disabled ? "admin-form--busy" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-busy={disabled || undefined}
      >
        <section className="admin-form__section">
          <header className="admin-form__section-header">
            <h2 className="admin-form__section-title">Layout da vitrine</h2>
            <p className="admin-form__section-desc">
              Define o visual do cabeçalho, rodapé, home e páginas internas. Os
              slots de banner abaixo acompanham a seleção atual. Salve para
              publicar o layout na vitrine.
            </p>
          </header>
          <div className="admin-form__section-body">
            <div
              className="admin-layout-picker"
              role="radiogroup"
              aria-label="Layout da vitrine"
            >
              {SITE_LAYOUT_OPTIONS.map((opt) => {
                const active = selectedLayout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`admin-layout-card${active ? " admin-layout-card--active" : ""}`}
                    onClick={() =>
                      onConfigChange({ ...config, layout: opt.id })
                    }
                    disabled={disabled}
                  >
                    <div className="admin-layout-card__preview">
                      <LayoutPreview
                        id={opt.id}
                        primaryColor={primaryColor}
                      />
                    </div>
                    <div className="admin-layout-card__meta">
                      <strong>{opt.nome}</strong>
                      <span>{opt.descricao}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {layoutDraft ? (
              <p className="admin-alert admin-alert--warn" role="status">
                Layout em rascunho. Os slots abaixo já mostram as áreas deste
                layout. Salve para publicar na vitrine.
              </p>
            ) : null}
          </div>
        </section>

      </form>

      <section className="admin-form__section admin-config-vitrine__banners">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Banners</h2>
          <p className="admin-form__section-desc">
            Áreas conforme o layout selecionado acima. Ao escolher a imagem, o
            banner é criado ou atualizado automaticamente.
          </p>
        </header>
        <BannersClient
          initialItems={initialBanners}
          layout={selectedLayout}
          embedded
        />
      </section>
    </div>
  );
}
