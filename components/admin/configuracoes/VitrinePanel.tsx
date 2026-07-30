"use client";

import { useState } from "react";
import { BannersClient } from "@/components/admin/BannersClient";
import { FieldHint } from "@/components/admin/FieldHint";
import { LayoutPreview } from "@/components/admin/configuracoes/siteTheme";
import { VitrinePreview } from "@/components/admin/configuracoes/VitrinePreview";
import { SITE_LAYOUT_OPTIONS } from "@/components/public/layouts/options";
import type { Banner } from "@/src/schemas/banner";
import type { SiteConfig, SiteLayoutId } from "@/src/schemas/site-config";
import styles from "./VitrinePanel.module.css";

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
  const [banners, setBanners] = useState<Banner[]>(initialBanners);

  const preview = (
    <VitrinePreview
      layout={selectedLayout}
      banners={banners}
      storeName={config.nomeLoja}
      primaryColor={primaryColor}
      live
    />
  );

  return (
    <div className="admin-config-vitrine">
      <div className={styles.guide} aria-label="Como configurar a vitrine">
        <p className={styles.guideTitle}>Como funciona</p>
        <ol className={styles.guideSteps}>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              1
            </span>
            <span>
              <strong>Escolha o modelo</strong> da página inicial. A prévia ao
              lado mostra onde cada área aparece.
            </span>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              2
            </span>
            <span>
              <strong>Configure as áreas</strong> numeradas abaixo — envie as
              fotos e, se quiser, o link e o texto do botão.
            </span>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              3
            </span>
            <span>
              <strong>Salve o layout</strong> no botão Salvar. As imagens são
              gravadas na hora, ao escolher o arquivo.
            </span>
          </li>
        </ol>
      </div>

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
            <h2 className="admin-form__section-title">
              Modelo da página inicial
              <FieldHint text="O modelo define a disposição do topo, do meio e do final da home. Cabeçalho e rodapé também acompanham a escolha. As áreas de imagem abaixo mudam conforme o modelo." />
            </h2>
            <p className="admin-form__section-desc">
              Compare os três modelos e veja na prévia onde cada foto será
              exibida. Depois de escolher, clique em Salvar para publicar o
              modelo na loja.
            </p>
          </header>

          <div className={`admin-form__section-body ${styles.sectionBody}`}>
            <details className={styles.previewMobile}>
              <summary className={styles.previewMobileSummary}>
                Ver prévia da home
              </summary>
              <div className={styles.previewMobileBody}>{preview}</div>
            </details>

            <div className={styles.edit}>
              <div
                className="admin-layout-picker"
                role="radiogroup"
                aria-label="Modelo da página inicial"
              >
                {SITE_LAYOUT_OPTIONS.map((opt) => {
                  const active = selectedLayout === opt.id;
                  const published = baselineLayout === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`admin-layout-card ${styles.layoutCard}${active ? " admin-layout-card--active" : ""}`}
                      onClick={() =>
                        onConfigChange({ ...config, layout: opt.id })
                      }
                      disabled={disabled}
                    >
                      {active ? (
                        <span
                          className={`${styles.layoutBadge}${layoutDraft ? ` ${styles.layoutBadgeDraft}` : ""}`}
                        >
                          {layoutDraft ? "Selecionado" : "Em uso"}
                        </span>
                      ) : published ? (
                        <span className={styles.layoutBadge}>Publicado</span>
                      ) : null}
                      <div className="admin-layout-card__preview">
                        <LayoutPreview
                          id={opt.id}
                          primaryColor={primaryColor}
                        />
                      </div>
                      <div className="admin-layout-card__meta">
                        <strong>{opt.nome}</strong>
                        <span>{opt.descricao}</span>
                        <span className={styles.layoutImpact}>{opt.impacto}</span>
                        <span className={styles.layoutAreas}>
                          {opt.areasResumo}
                        </span>
                        <ul className={styles.layoutList}>
                          {opt.destaques.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>

              {layoutDraft ? (
                <p className="admin-alert admin-alert--warn" role="status">
                  Modelo em rascunho. A prévia e as áreas abaixo já mostram o
                  novo arranjo, mas você precisa clicar em <strong>Salvar</strong>{" "}
                  para publicar. Enquanto isso, só é possível editar banners
                  compatíveis com o modelo ainda publicado (
                  {
                    SITE_LAYOUT_OPTIONS.find((o) => o.id === baselineLayout)
                      ?.nome
                  }
                  ).
                </p>
              ) : null}
            </div>

            <aside className={styles.previewAside}>{preview}</aside>
          </div>
        </section>
      </form>

      <section className="admin-form__section admin-config-vitrine__banners">
        <header className={`admin-form__section-header ${styles.bannersHeader}`}>
          <div>
            <h2 className="admin-form__section-title">
              Áreas de imagem
              <FieldHint text="Cada card numerado corresponde a um marcador na prévia. Ao escolher a imagem, ela é salva automaticamente. Link e texto do botão pedem um clique em Salvar detalhes." />
            </h2>
            <p className="admin-form__section-desc">
              As áreas mudam conforme o modelo selecionado. Use a prévia para
              entender onde cada uma aparece na loja.
            </p>
          </div>
          <p className={styles.bannersAutosave}>Imagens salvam ao enviar</p>
        </header>
        <div className="admin-form__section-body">
          <BannersClient
            initialItems={banners}
            layout={selectedLayout}
            publishedLayout={baselineLayout}
            embedded
            onItemsChange={setBanners}
          />
        </div>
      </section>
    </div>
  );
}
