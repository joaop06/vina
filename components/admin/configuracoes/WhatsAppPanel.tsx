"use client";

import { MensagemProdutoEditor } from "@/components/admin/configuracoes/MensagemProdutoEditor";
import { MensagemCarrinhoEditor } from "@/components/admin/configuracoes/MensagemCarrinhoEditor";
import { WhatsAppSectionSplit } from "@/components/admin/configuracoes/WhatsAppSectionSplit";
import styles from "@/components/admin/configuracoes/WhatsAppPanel.module.css";
import { formatBrWhatsApp, normalizeWaDigits } from "@/src/lib/wa";
import type { SiteConfig } from "@/src/schemas/site-config";

export function WhatsAppPanel({
  formId,
  config,
  disabled,
  onSubmit,
  onConfigChange,
  onOpenIdentidadeTab,
}: {
  formId: string;
  config: SiteConfig;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
  onOpenIdentidadeTab?: () => void;
}) {
  const cartEnabled = Boolean(config.mostrarCarrinho);
  const mensagemPadraoPreview =
    config.whatsapp.mensagemPadrao.trim() ||
    "Olá! Vim pelo site e gostaria de mais informações.";

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
          <h2 className="admin-form__section-title">WhatsApp</h2>
          <p className="admin-form__section-desc">
            Número e textos que o cliente vê ao falar com você pela loja.
          </p>
        </header>
        <div className="admin-form__section-body">
          <WhatsAppSectionSplit
            previewLabel="Assim abre no aplicativo"
            previewText={mensagemPadraoPreview}
          >
            <div className={styles.waFieldsStack}>
              <div>
                <div className="admin-field-label">
                  Seu número (DDD + celular)
                  <label
                    className="admin-switch"
                    data-disabled={disabled ? "true" : undefined}
                  >
                    <span>Mostrar botão na loja</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={Boolean(config.whatsapp.mostrar)}
                      disabled={disabled}
                      aria-label="Mostrar botão WhatsApp na loja"
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          whatsapp: {
                            ...config.whatsapp,
                            mostrar: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="admin-switch__track" aria-hidden="true" />
                  </label>
                </div>
                <input
                  className="input"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(16) 99999-9999"
                  disabled={disabled}
                  value={formatBrWhatsApp(config.whatsapp.telefone)}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      whatsapp: {
                        ...config.whatsapp,
                        telefone: normalizeWaDigits(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <label className="admin-form__field">
                <span className="wa-settings__field-title">
                  Quando clicam no WhatsApp do site
                </span>
                <span className="wa-settings__field-help">
                  Aparece já escrita no aplicativo — por exemplo no rodapé ou na
                  home.
                </span>
                <textarea
                  className="textarea"
                  rows={2}
                  disabled={disabled}
                  value={config.whatsapp.mensagemPadrao}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      whatsapp: {
                        ...config.whatsapp,
                        mensagemPadrao: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          </WhatsAppSectionSplit>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">
            Interesse em um produto
          </h2>
          <p className="admin-form__section-desc">
            O nome do produto e os detalhes que o cliente escolher entram
            sozinhos — você só personaliza o texto.
          </p>
        </header>
        <div className="admin-form__section-body">
          <MensagemProdutoEditor
            config={config}
            disabled={disabled}
            onConfigChange={onConfigChange}
          />
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Pedido pelo carrinho</h2>
          <p className="admin-form__section-desc">
            Quando o cliente monta vários produtos e envia um único WhatsApp
            pela página do carrinho.
          </p>
        </header>
        <div
          className={[
            "admin-form__section-body",
            !cartEnabled ? "admin-form__section-body--cart-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!cartEnabled ? (
            <div
              className="admin-form__section-notice"
              role="status"
            >
              <p>
                O carrinho está desabilitado na loja. Os clientes não veem
                carrinho nem enviam pedido por essa mensagem.
              </p>
              {onOpenIdentidadeTab ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onOpenIdentidadeTab}
                >
                  Ativar na aba Identidade
                </button>
              ) : null}
            </div>
          ) : null}
          <MensagemCarrinhoEditor
            config={config}
            disabled={disabled || !cartEnabled}
            previewMuted={!cartEnabled}
            onConfigChange={onConfigChange}
          />
        </div>
      </section>
    </form>
  );
}
