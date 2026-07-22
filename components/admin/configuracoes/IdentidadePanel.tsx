"use client";

import { useEffect, useState } from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import { ImageField, type ImageMeta } from "@/components/admin/ImageField";
import {
  expandHexIfComplete,
  normalizeHexForPicker,
} from "@/components/admin/configuracoes/siteTheme";
import type { SiteConfig } from "@/src/schemas/site-config";

type ColorKey = keyof SiteConfig["cores"];

const COLOR_FIELDS: Array<{
  key: ColorKey;
  label: string;
  hint: string;
}> = [
  {
    key: "primaria",
    label: "Cor primária",
    hint: "Cor de destaque na vitrine (cabeçalho, botões) e acentos do painel admin.",
  },
  {
    key: "secundaria",
    label: "Cor secundária",
    hint: "Textos fortes, contraste e fundos escuros da vitrine.",
  },
  {
    key: "fundo",
    label: "Fundo",
    hint: "Cor de fundo principal das páginas.",
  },
  {
    key: "fundoNeutro",
    label: "Fundo neutro",
    hint: "Fundos suaves de seções, cards e áreas secundárias.",
  },
  {
    key: "borda",
    label: "Borda",
    hint: "Linhas e contornos da interface.",
  },
];

function ColorField({
  label,
  hint,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  hint: string;
  value: string;
  disabled?: boolean;
  onCommit: (hex: string) => void;
}) {
  const [hexDraft, setHexDraft] = useState(value);
  const pickerValue = normalizeHexForPicker(value);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  return (
    <label className="admin-form__field admin-config-color">
      <span className="admin-field-label">
        {label}
        <FieldHint text={hint} />
      </span>
      <div className="admin-color-field">
        <input
          type="color"
          className="admin-color-field__swatch"
          value={pickerValue}
          disabled={disabled}
          onChange={(e) => {
            const nextPicker = e.target.value.toLowerCase();
            if (nextPicker === pickerValue) return;
            const next = nextPicker.toUpperCase();
            setHexDraft(next);
            onCommit(next);
          }}
          aria-label={`Selecionar ${label.toLowerCase()}`}
        />
        <input
          className="input"
          value={hexDraft}
          spellCheck={false}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            setHexDraft(raw);
            const expanded = expandHexIfComplete(raw);
            if (expanded) onCommit(expanded);
          }}
          onBlur={() => {
            const expanded = expandHexIfComplete(hexDraft);
            if (expanded) {
              setHexDraft(expanded);
              onCommit(expanded);
            } else {
              setHexDraft(value);
            }
          }}
        />
      </div>
    </label>
  );
}

export function IdentidadePanel({
  formId,
  config,
  logoDraft,
  disabled,
  onSubmit,
  onConfigChange,
  onLogoChange,
}: {
  formId: string;
  config: SiteConfig;
  logoDraft: ImageMeta | null;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
  onLogoChange: (next: ImageMeta | null) => void;
}) {
  function setColor(key: ColorKey, hex: string) {
    const current = config.cores[key];
    if (current === hex) return;
    if (
      expandHexIfComplete(current) !== null &&
      normalizeHexForPicker(current) === normalizeHexForPicker(hex)
    ) {
      return;
    }
    onConfigChange({
      ...config,
      cores: { ...config.cores, [key]: hex },
    });
  }

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
      aria-busy={disabled || undefined}
    >
      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Marca</h2>
          <p className="admin-form__section-desc">
            Logo, nome e textos de identidade exibidos na vitrine.
          </p>
        </header>
        <div className="admin-form__section-body admin-config-marca">
          <div className="admin-config-marca__logo">
            <span className="admin-field-label">
              Logo da loja
              <FieldHint text="Exibida no cabeçalho, rodapé e como ícone da aba do navegador." />
            </span>
            <ImageField
              dominio="site"
              value={logoDraft}
              onChange={onLogoChange}
              disabled={disabled}
              label="Logo"
              showAlt={false}
              showRemove
            />
          </div>

          <div className="admin-config-marca__text">
            <div className="admin-form__field">
              <div className="admin-field-label">
                Nome da loja
                <FieldHint text="Cabeçalho, rodapé, home e título das páginas na vitrine. Com logo carregada, o switch controla se o nome também aparece no cabeçalho." />
                <label
                  className="admin-switch"
                  data-disabled={!logoDraft || disabled ? "true" : undefined}
                  title={
                    logoDraft
                      ? "Mostrar o nome junto da logo no cabeçalho"
                      : "Disponível quando houver logo da loja"
                  }
                >
                  <span>Mostrar no cabeçalho</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={Boolean(logoDraft && config.mostrarNomeComLogo)}
                    disabled={!logoDraft || disabled}
                    aria-label="Mostrar nome da loja no cabeçalho quando houver logo"
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        mostrarNomeComLogo: e.target.checked,
                      })
                    }
                  />
                  <span className="admin-switch__track" aria-hidden="true" />
                </label>
              </div>
              <input
                className="input"
                value={config.nomeLoja}
                disabled={disabled}
                onChange={(e) =>
                  onConfigChange({ ...config, nomeLoja: e.target.value })
                }
              />
            </div>

            <label className="admin-form__field">
              <span className="admin-field-label">
                Assinatura
                <FieldHint text="Linha sob o nome no cabeçalho e no rodapé." />
              </span>
              <input
                className="input"
                value={config.assinatura}
                disabled={disabled}
                onChange={(e) =>
                  onConfigChange({ ...config, assinatura: e.target.value })
                }
              />
            </label>
          </div>

          <label className="admin-config-marca__slogan admin-form__span">
            <span className="admin-field-label">
              Slogan
              <FieldHint text="Meta description do site e texto do hero na home (se não houver banner)." />
            </span>
            <textarea
              className="textarea"
              rows={2}
              value={config.slogan}
              disabled={disabled}
              onChange={(e) =>
                onConfigChange({ ...config, slogan: e.target.value })
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-form__section admin-form__section--compact">
        <div className="admin-form__section-body admin-config-loja">
          <div className="admin-field-label admin-config-loja-toggle">
            Mostrar carrinho na loja
            <FieldHint text="Configuração global da vitrine. Também habilita ou desativa a mensagem de pedido pelo carrinho no WhatsApp." />
            <label
              className="admin-switch admin-config-loja-toggle__switch"
              data-disabled={disabled ? "true" : undefined}
            >
              <input
                type="checkbox"
                role="switch"
                checked={Boolean(config.mostrarCarrinho)}
                disabled={disabled}
                aria-label="Mostrar carrinho na loja"
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    mostrarCarrinho: e.target.checked,
                  })
                }
              />
              <span className="admin-switch__track" aria-hidden="true" />
            </label>
          </div>
          <p className="admin-config-loja__desc">
            {config.mostrarCarrinho ? (
              <>
                <strong>Ligado:</strong> ícone do carrinho no cabeçalho, botão
                &quot;Adicionar ao carrinho&quot; nos produtos, página{" "}
                <code>/carrinho</code> e pedido em lote pelo WhatsApp a partir
                do carrinho.
              </>
            ) : (
              <>
                <strong>Desligado:</strong> carrinho oculto na vitrine; o cliente
                só fala pelo WhatsApp produto a produto. A mensagem de pedido
                pelo carrinho fica inativa no painel.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Cores</h2>
          <p className="admin-form__section-desc">
            Paleta aplicada à vitrine e ao painel. A pré-visualização é ao vivo.
          </p>
        </header>
        <div className="admin-form__section-body admin-config-colors">
          {COLOR_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={config.cores[field.key]}
              disabled={disabled}
              onCommit={(hex) => setColor(field.key, hex)}
            />
          ))}
        </div>
      </section>
    </form>
  );
}
