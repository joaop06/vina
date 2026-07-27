"use client";

import type { SiteConfig } from "@/src/schemas/site-config";
import { siteFonteIdSchema } from "@/src/schemas/site-personalization";

export function TemaAvancadoPanel({
  formId,
  config,
  disabled,
  onSubmit,
  onConfigChange,
}: {
  formId: string;
  config: SiteConfig;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const tema = config.tema;

  return (
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
    >
      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Tema avançado</h2>
          <p className="admin-form__section-desc">
            Raio, largura do container e cores dos ícones WhatsApp/Instagram.
          </p>
        </header>
        <div className="admin-form__section-body">
          <label className="admin-form__field">
            <span className="admin-field-label">Raio (px)</span>
            <input
              className="input"
              type="number"
              min={0}
              max={32}
              disabled={disabled}
              value={tema.raio}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  tema: { ...tema, raio: Number(e.target.value) || 0 },
                })
              }
            />
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Largura máx. container (px)</span>
            <input
              className="input"
              disabled={disabled}
              value={tema.larguraContainer}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  tema: { ...tema, larguraContainer: e.target.value },
                })
              }
            />
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Cor WhatsApp</span>
            <input
              className="input"
              disabled={disabled}
              value={tema.corWhatsapp}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  tema: { ...tema, corWhatsapp: e.target.value },
                })
              }
            />
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Cor Instagram</span>
            <input
              className="input"
              disabled={disabled}
              value={tema.corInstagram}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  tema: { ...tema, corInstagram: e.target.value },
                })
              }
            />
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Fonte corpo</span>
            <select
              className="input"
              disabled={disabled}
              value={tema.fonteCorpo}
              onChange={(e) => {
                const v = siteFonteIdSchema.parse(e.target.value);
                onConfigChange({
                  ...config,
                  tema: { ...tema, fonteCorpo: v },
                });
              }}
            >
              <option value="poppins">Poppins</option>
              <option value="inter">Inter</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Fonte destaque</span>
            <select
              className="input"
              disabled={disabled}
              value={tema.fonteDisplay}
              onChange={(e) => {
                const v = siteFonteIdSchema.parse(e.target.value);
                onConfigChange({
                  ...config,
                  tema: { ...tema, fonteDisplay: v },
                });
              }}
            >
              <option value="bebas-neue">Bebas Neue</option>
              <option value="poppins">Poppins</option>
              <option value="system">Sistema</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">SEO</h2>
        </header>
        <div className="admin-form__section-body">
          <label className="admin-form__field">
            <span className="admin-field-label">Template título (%s · loja)</span>
            <input
              className="input"
              disabled={disabled}
              value={config.seo.titleTemplate}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  seo: { ...config.seo, titleTemplate: e.target.value },
                })
              }
            />
          </label>
          <label className="admin-form__field">
            <span className="admin-field-label">Idioma (lang)</span>
            <input
              className="input"
              disabled={disabled}
              value={config.seo.idioma}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  seo: { ...config.seo, idioma: e.target.value },
                })
              }
            />
          </label>
        </div>
      </section>
    </form>
  );
}
