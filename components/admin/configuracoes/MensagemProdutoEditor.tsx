"use client";

import { productWaMessageFromParts } from "@/src/lib/wa";
import {
  type ProductWaTemplateParts,
} from "@/src/lib/wa-product-template";
import {
  DEFAULT_COMPACT_CART_ITEM_PARTS,
  type CompactCartItemParts,
} from "@/src/lib/wa-compact-template";
import { DEFAULT_PRODUCT_WA_TEMPLATE_PARTS } from "@/src/lib/wa-product-template";
import { WhatsAppSectionSplit } from "@/components/admin/configuracoes/WhatsAppSectionSplit";
import type { SiteConfig } from "@/src/schemas/site-config";
import { useMemo } from "react";

const PREVIEW = {
  nome: "Vestido floral",
  slug: "vestido-floral",
  referencia: "12425",
  tamanho: "M",
  cor: "Azul",
  quantidade: 1,
} as const;

export function MensagemProdutoEditor({
  config,
  disabled,
  onConfigChange,
}: {
  config: SiteConfig;
  disabled?: boolean;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const wa = config.whatsapp;
  const value = wa.mensagemProdutoParts ?? DEFAULT_PRODUCT_WA_TEMPLATE_PARTS;
  const incluirReferencia = Boolean(wa.mensagemProdutoIncluirReferencia);
  const compactParts =
    wa.mensagemProdutoItemCompactoParts ?? DEFAULT_COMPACT_CART_ITEM_PARTS;
  const formatoItens = wa.mensagemProdutoFormatoItens ?? "produto";

  const preview = useMemo(
    () =>
      productWaMessageFromParts(value, PREVIEW.nome, PREVIEW.slug, {
        tamanho: PREVIEW.tamanho,
        cor: PREVIEW.cor,
        quantidade: PREVIEW.quantidade,
        referencia: PREVIEW.referencia,
        mensagemProdutoIncluirReferencia: incluirReferencia,
        formatoItens,
        itemCompactoParts: compactParts,
      }),
    [value, incluirReferencia, formatoItens, compactParts],
  );

  function patchWhatsapp(partial: Partial<SiteConfig["whatsapp"]>) {
    onConfigChange({
      ...config,
      whatsapp: { ...config.whatsapp, ...partial },
    });
  }

  function update(next: ProductWaTemplateParts) {
    patchWhatsapp({ mensagemProdutoParts: next });
  }

  function updateCompact(next: CompactCartItemParts) {
    patchWhatsapp({ mensagemProdutoItemCompactoParts: next });
  }

  return (
    <WhatsAppSectionSplit
      previewLabel="Assim o cliente vai ver"
      previewText={preview}
    >
      <div className="wa-product-msg">
      <div className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">Formato do item</span>
        <div className="admin-config-wa-row__head">
          <fieldset className="wa-cart-format" disabled={disabled}>
            <label className="wa-cart-format__option">
              <input
                type="radio"
                name="mensagemProdutoFormatoItens"
                checked={formatoItens === "produto"}
                onChange={() =>
                  patchWhatsapp({ mensagemProdutoFormatoItens: "produto" })
                }
              />
              <span>Lista com marcadores (opções abaixo)</span>
            </label>
            <label className="wa-cart-format__option">
              <input
                type="radio"
                name="mensagemProdutoFormatoItens"
                checked={formatoItens === "compacto"}
                onChange={() =>
                  patchWhatsapp({ mensagemProdutoFormatoItens: "compacto" })
                }
              />
              <span>Linha compacta (opções abaixo)</span>
            </label>
          </fieldset>
        </div>
      </div>

      <label className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">Título em negrito</span>
        <span className="wa-product-msg__block-desc">
          Aparece uma vez no topo, em negrito no WhatsApp.
          {formatoItens === "produto"
            ? " O nome do produto vem na lista abaixo."
            : " Em seguida vem uma linha com o produto."}
        </span>
        <input
          className="input"
          disabled={disabled}
          value={value.intro}
          onChange={(e) => update({ ...value, intro: e.target.value })}
        />
      </label>

      {formatoItens === "compacto" ? (
        <>
          <div className="wa-product-msg__block">
            <span className="wa-product-msg__block-title">
              Marcação da linha
            </span>
            <fieldset className="wa-cart-format" disabled={disabled}>
              {(
                [
                  ["•", "• (bullet)"],
                  ["-", "- (traço)"],
                  ["none", "Sem prefixo"],
                ] as const
              ).map(([bullet, label]) => (
                <label key={bullet} className="wa-cart-format__option">
                  <input
                    type="radio"
                    name="compactProductBullet"
                    checked={compactParts.bullet === bullet}
                    onChange={() =>
                      updateCompact({ ...compactParts, bullet })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="wa-product-msg__block">
            <span className="wa-product-msg__block-title">
              Incluir na linha
            </span>
            <div className="wa-product-msg__toggles">
              <label
                className="admin-switch admin-switch--block"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Resumo (tamanho, cor, quantidade)</span>
                <input
                  type="checkbox"
                  role="switch"
                  disabled={disabled}
                  checked={compactParts.showResumo}
                  onChange={(e) =>
                    updateCompact({
                      ...compactParts,
                      showResumo: e.target.checked,
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
              <label
                className="admin-switch admin-switch--block"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Quantidade (x2)</span>
                <input
                  type="checkbox"
                  role="switch"
                  disabled={disabled}
                  checked={compactParts.showQuantidade}
                  onChange={(e) =>
                    updateCompact({
                      ...compactParts,
                      showQuantidade: e.target.checked,
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
              <label
                className="admin-switch admin-switch--block"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Link da página</span>
                <input
                  type="checkbox"
                  role="switch"
                  disabled={disabled}
                  checked={compactParts.showUrl}
                  onChange={(e) =>
                    updateCompact({
                      ...compactParts,
                      showUrl: e.target.checked,
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
              <label
                className="admin-switch admin-switch--block"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Referência separada (além do nome)</span>
                <input
                  type="checkbox"
                  role="switch"
                  disabled={disabled}
                  checked={compactParts.showReferenciaSeparada}
                  onChange={(e) =>
                    updateCompact({
                      ...compactParts,
                      showReferenciaSeparada: e.target.checked,
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
              <label
                className="admin-switch admin-switch--block"
                data-disabled={disabled ? "true" : undefined}
              >
                <span>Referência junto ao nome (quando cadastrada)</span>
                <input
                  type="checkbox"
                  role="switch"
                  disabled={disabled}
                  checked={incluirReferencia}
                  aria-label="Incluir referência interna junto ao nome do produto"
                  onChange={(e) =>
                    patchWhatsapp({
                      mensagemProdutoIncluirReferencia: e.target.checked,
                    })
                  }
                />
                <span className="admin-switch__track" aria-hidden="true" />
              </label>
            </div>
          </div>
        </>
      ) : (
        <div className="wa-product-msg__block">
          <span className="wa-product-msg__block-title">Incluir na mensagem</span>
          <div className="wa-product-msg__toggles">
            <label
              className="admin-switch admin-switch--block"
              data-disabled={disabled ? "true" : undefined}
            >
              <span>Tamanho, cor e quantidade</span>
              <input
                type="checkbox"
                role="switch"
                disabled={disabled}
                checked={value.includeVariantDetails}
                aria-label="Incluir tamanho, cor e quantidade na mensagem"
                onChange={(e) =>
                  update({ ...value, includeVariantDetails: e.target.checked })
                }
              />
              <span className="admin-switch__track" aria-hidden="true" />
            </label>
            <label
              className="admin-switch admin-switch--block"
              data-disabled={disabled ? "true" : undefined}
            >
              <span>Referência junto ao nome (quando cadastrada)</span>
              <input
                type="checkbox"
                role="switch"
                disabled={disabled}
                checked={incluirReferencia}
                aria-label="Incluir referência interna junto ao nome do produto"
                onChange={(e) =>
                  patchWhatsapp({
                    mensagemProdutoIncluirReferencia: e.target.checked,
                  })
                }
              />
              <span className="admin-switch__track" aria-hidden="true" />
            </label>
            <label
              className="admin-switch admin-switch--block"
              data-disabled={disabled ? "true" : undefined}
            >
              <span>Link da página do produto</span>
              <input
                type="checkbox"
                role="switch"
                disabled={disabled}
                checked={value.includeUrl}
                aria-label="Incluir link da página do produto na mensagem"
                onChange={(e) =>
                  update({ ...value, includeUrl: e.target.checked })
                }
              />
              <span className="admin-switch__track" aria-hidden="true" />
            </label>
          </div>
        </div>
      )}

      <label className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">
          Alguma pergunta no final? (opcional)
        </span>
        <textarea
          className="textarea"
          rows={2}
          disabled={disabled}
          value={value.outro}
          onChange={(e) => update({ ...value, outro: e.target.value })}
        />
      </label>
      </div>
    </WhatsAppSectionSplit>
  );
}
