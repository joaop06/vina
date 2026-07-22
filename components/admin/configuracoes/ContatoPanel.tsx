"use client";

import { FieldHint } from "@/components/admin/FieldHint";
import { EnderecoLocalFields } from "@/components/admin/configuracoes/EnderecoLocalFields";
import { configTabHref } from "@/components/admin/configuracoes/configTabs";
import { instagramProfileUrl, syncInstagram } from "@/src/lib/instagram";
import { formatBrWhatsApp, normalizeWaDigits } from "@/src/lib/wa";
import type { SiteConfig } from "@/src/schemas/site-config";
import Link from "next/link";

export function ContatoPanel({
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
          <h2 className="admin-form__section-title">Instagram</h2>
          <p className="admin-form__section-desc">
            Perfil exibido nos botões e no rodapé da vitrine.
          </p>
        </header>
        <div className="admin-form__section-body">
          <div className="admin-form__field">
            <div className="admin-field-label">
              Instagram
              <FieldHint text="Links Instagram na home, produto, Sobre e rodapé." />
              <label
                className="admin-switch"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Mostrar botão</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={Boolean(config.instagram.mostrar)}
                  disabled={disabled}
                  aria-label="Mostrar botão Instagram"
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      instagram: {
                        ...config.instagram,
                        mostrar: e.target.checked,
                      },
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
            </div>
            <label>
              <span className="admin-field-label">Nome de usuário @</span>
              <input
                className="input"
                placeholder="minhaloja"
                disabled={disabled}
                value={config.instagram.handle}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    instagram: syncInstagram({
                      ...config.instagram,
                      handle: e.target.value,
                    }),
                  })
                }
              />
              {config.instagram.handle ? (
                <p className="admin-form__section-desc">
                  {instagramProfileUrl(config.instagram.handle)}
                </p>
              ) : null}
            </label>
          </div>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Endereço e horários</h2>
          <p className="admin-form__section-desc">Endereço e horários exibidos na página Sobre.</p>
        </header>
        <div className="admin-form__section-body">
          <EnderecoLocalFields
            config={config}
            disabled={disabled}
            onConfigChange={onConfigChange}
          />

          <div className="admin-form__span">
            <div className="admin-field-label">
              Horário de atendimento
              <FieldHint text="Exibido no rodapé e na página Sobre. Deixe em branco para ocultar." />
            </div>
            <textarea
              className="textarea"
              rows={2}
              disabled={disabled}
              placeholder="Seg–Sex 9h–18h · Sáb 9h–13h"
              value={config.horarios}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  horarios: e.target.value,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Telefones</h2>
          <p className="admin-form__section-desc">
            Fixo e celular do rodapé. O celular pode reutilizar o WhatsApp.
          </p>
        </header>
        <div className="admin-form__section-body">
          <div className="admin-form__row admin-form__row--2 admin-form__row--telefones">
            <div className="admin-form__field">
              <div className="admin-form__telefone-head">
                <div className="admin-field-label">
                  Telefone fixo
                  <FieldHint text="Número de telefone fixo no rodapé." />
                </div>
                <label
                  className="admin-switch"
                  data-disabled={disabled ? "true" : undefined}
                >
                  <span>Mostrar no rodapé</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={Boolean(config.telefones.mostrarFixo)}
                    disabled={disabled}
                    aria-label="Mostrar telefone fixo no rodapé"
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        telefones: {
                          ...config.telefones,
                          mostrarFixo: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="admin-switch__track" aria-hidden="true" />
                </label>
              </div>
              <p className="admin-form__section-desc admin-form__telefone-meta">
                {"\u00A0"}
              </p>
              <input
                className="input admin-form__telefone-input"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(16) 3333-3333"
                disabled={disabled}
                value={formatBrWhatsApp(config.telefones.fixo)}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    telefones: {
                      ...config.telefones,
                      fixo: normalizeWaDigits(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div className="admin-form__field">
              <div className="admin-form__telefone-head">
                <div className="admin-field-label">
                  Celular
                  <FieldHint text="Número de celular no rodapé. Pode reutilizar o WhatsApp." />
                </div>
                <div className="admin-form__telefone-switches">
                  <label
                    className="admin-switch"
                    data-disabled={disabled ? "true" : undefined}
                  >
                    <span>Mostrar no rodapé</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={Boolean(config.telefones.mostrarCelular)}
                      disabled={disabled}
                      aria-label="Mostrar celular no rodapé"
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          telefones: {
                            ...config.telefones,
                            mostrarCelular: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="admin-switch__track" aria-hidden="true" />
                  </label>
                  <label
                    className="admin-switch"
                    data-disabled={disabled ? "true" : undefined}
                  >
                    <span>Usar WhatsApp</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={Boolean(config.telefones.usarWhatsappComoCelular)}
                      disabled={disabled}
                      aria-label="Usar o número do WhatsApp como celular no rodapé"
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          telefones: {
                            ...config.telefones,
                            usarWhatsappComoCelular: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="admin-switch__track" aria-hidden="true" />
                  </label>
                </div>
              </div>
              <p className="admin-form__section-desc admin-form__telefone-meta">
                {config.telefones.usarWhatsappComoCelular ? (
                  <>
                    Número na aba{" "}
                    <Link href={configTabHref("whatsapp")}>WhatsApp</Link>.
                  </>
                ) : (
                  "\u00A0"
                )}
              </p>
              <input
                className="input admin-form__telefone-input"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(16) 99999-9999"
                disabled={
                  disabled || Boolean(config.telefones.usarWhatsappComoCelular)
                }
                value={formatBrWhatsApp(
                  config.telefones.usarWhatsappComoCelular
                    ? config.whatsapp.telefone
                    : config.telefones.celular,
                )}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    telefones: {
                      ...config.telefones,
                      celular: normalizeWaDigits(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Textos da loja</h2>
          <p className="admin-form__section-desc">
            Conteúdos das páginas Sobre e Trocas na vitrine.
          </p>
        </header>
        <div className="admin-form__section-body">
          <label className="admin-form__span">
            <span className="admin-field-label">
              Texto Sobre
              <FieldHint text="Conteúdo da página Sobre na vitrine." />
            </span>
            <textarea
              className="textarea"
              rows={5}
              disabled={disabled}
              value={config.textos.sobre}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  textos: { ...config.textos, sobre: e.target.value },
                })
              }
            />
          </label>
          <label className="admin-form__span">
            <span className="admin-field-label">
              Texto Trocas
              <FieldHint text="Política de trocas e devoluções exibida na vitrine." />
            </span>
            <textarea
              className="textarea"
              rows={5}
              disabled={disabled}
              value={config.textos.trocas}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  textos: { ...config.textos, trocas: e.target.value },
                })
              }
            />
          </label>
        </div>
      </section>
    </form>
  );
}
