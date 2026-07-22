"use client";

import { useMemo } from "react";
import { cartWaMessage } from "@/src/lib/wa";
import {
  type CartWaTemplateParts,
} from "@/src/lib/wa-cart-template";
import {
  type CompactCartItemParts,
} from "@/src/lib/wa-compact-template";
import { WhatsAppSectionSplit } from "@/components/admin/configuracoes/WhatsAppSectionSplit";
import type { SiteConfig } from "@/src/schemas/site-config";

const PREVIEW_LINES = [
  {
    nome: "Vestido floral",
    slug: "vestido-floral",
    referencia: "12425",
    tamanho: "M",
    cor: "Azul",
    quantidade: 1,
  },
  {
    nome: "Sandália confort",
    slug: "sandalia-confort",
    referencia: "",
    tamanho: "38",
    cor: "Preto",
    quantidade: 2,
  },
] as const;

export function MensagemCarrinhoEditor({
  config,
  disabled,
  previewMuted,
  onConfigChange,
}: {
  config: SiteConfig;
  disabled?: boolean;
  previewMuted?: boolean;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const wa = config.whatsapp;
  const envelopeParts = wa.mensagemCarrinhoParts;
  const compactParts = wa.mensagemCarrinhoItemCompactoParts;

  const preview = useMemo(
    () =>
      cartWaMessage(
        {
          mensagemProdutoParts: wa.mensagemProdutoParts,
          mensagemCarrinhoParts: wa.mensagemCarrinhoParts,
          mensagemCarrinhoItemCompactoParts: wa.mensagemCarrinhoItemCompactoParts,
          mensagemCarrinhoFormatoItens: wa.mensagemCarrinhoFormatoItens,
          mensagemProdutoIncluirReferencia:
            wa.mensagemProdutoIncluirReferencia,
        },
        [...PREVIEW_LINES],
      ),
    [
      wa.mensagemProdutoParts,
      wa.mensagemCarrinhoParts,
      wa.mensagemCarrinhoItemCompactoParts,
      wa.mensagemCarrinhoFormatoItens,
      wa.mensagemProdutoIncluirReferencia,
    ],
  );

  function patchWhatsapp(partial: Partial<SiteConfig["whatsapp"]>) {
    onConfigChange({
      ...config,
      whatsapp: { ...config.whatsapp, ...partial },
    });
  }

  function updateEnvelope(next: CartWaTemplateParts) {
    patchWhatsapp({ mensagemCarrinhoParts: next });
  }

  function updateCompact(next: CompactCartItemParts) {
    patchWhatsapp({ mensagemCarrinhoItemCompactoParts: next });
  }

  return (
    <WhatsAppSectionSplit
      previewLabel="Exemplo com dois produtos"
      previewText={preview}
      previewMuted={previewMuted}
    >
      <div className="wa-product-msg">
      <div className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">Formato de cada item</span>
        <div className="admin-config-wa-row__head">
          <fieldset className="wa-cart-format" disabled={disabled}>
            <label className="wa-cart-format__option">
              <input
                type="radio"
                name="mensagemCarrinhoFormatoItens"
                checked={wa.mensagemCarrinhoFormatoItens === "produto"}
                onChange={() =>
                  patchWhatsapp({ mensagemCarrinhoFormatoItens: "produto" })
                }
              />
              <span>Igual à mensagem de um produto</span>
            </label>
            <label className="wa-cart-format__option">
              <input
                type="radio"
                name="mensagemCarrinhoFormatoItens"
                checked={wa.mensagemCarrinhoFormatoItens === "compacto"}
                onChange={() =>
                  patchWhatsapp({ mensagemCarrinhoFormatoItens: "compacto" })
                }
              />
              <span>Linha compacta (opções abaixo)</span>
            </label>
          </fieldset>
        </div>
      </div>

      {wa.mensagemCarrinhoFormatoItens === "compacto" ? (
        <>
          <div className="wa-product-msg__block">
            <span className="wa-product-msg__block-title">
              Marcação de cada linha
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
                    name="compactCartBullet"
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
              Incluir em cada item
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
            </div>
          </div>
        </>
      ) : (
        <p className="wa-product-msg__block-desc">
          A lista usa o título em negrito da seção &quot;Interesse em um
          produto&quot; (uma vez) e, para cada item, o nome do produto com
          tamanho, cor, quantidade e link conforme as opções daquela seção.
        </p>
      )}

      <label className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">Antes da lista</span>
        <span className="wa-product-msg__block-desc">
          Em seguida entra automaticamente a lista de produtos do carrinho.
        </span>
        <input
          className="input"
          disabled={disabled}
          value={envelopeParts.beforeItens}
          onChange={(e) =>
            updateEnvelope({ ...envelopeParts, beforeItens: e.target.value })
          }
        />
      </label>

      <label className="wa-product-msg__block">
        <span className="wa-product-msg__block-title">
          Alguma frase no final? (opcional)
        </span>
        <textarea
          className="textarea"
          rows={2}
          disabled={disabled}
          value={envelopeParts.outro}
          onChange={(e) =>
            updateEnvelope({ ...envelopeParts, outro: e.target.value })
          }
        />
      </label>
      </div>
    </WhatsAppSectionSplit>
  );
}
