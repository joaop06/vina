"use client";

import type { ProductVariant } from "@/src/schemas/product";
import {
  combinationExists,
  findVariant,
  isCorAvailable,
  isTamanhoAvailable,
  uniqueCores,
  uniqueTamanhos,
} from "@/src/lib/front/variants";
import { ProductQuantityStepper } from "@/components/public/ProductQuantityStepper";

type Props = {
  variantes: ProductVariant[];
  tamanho: string | null;
  cor: string | null;
  quantidade: number;
  onChange: (next: {
    tamanho: string | null;
    cor: string | null;
    variant: ProductVariant | null;
  }) => void;
  onQuantidadeChange: (next: number) => void;
};

export function ProductVariantPicker({
  variantes,
  tamanho,
  cor,
  quantidade,
  onChange,
  onQuantidadeChange,
}: Props) {
  if (variantes.length === 0) return null;

  const tamanhos = uniqueTamanhos(variantes);
  const cores = uniqueCores(variantes);
  const selected = findVariant(variantes, tamanho, cor);
  const stockMax = selected?.estoque ?? 0;
  const qtyEnabled = Boolean(selected) && stockMax > 0;

  function selectTamanho(next: string) {
    const nextTamanho = tamanho === next ? null : next;
    const nextCor =
      nextTamanho && cor && !combinationExists(variantes, nextTamanho, cor)
        ? null
        : cor;
    onChange({
      tamanho: nextTamanho,
      cor: nextCor,
      variant: findVariant(variantes, nextTamanho, nextCor),
    });
  }

  function selectCor(next: string) {
    const nextCor = cor === next ? null : next;
    const nextTamanho =
      nextCor && tamanho && !combinationExists(variantes, tamanho, nextCor)
        ? null
        : tamanho;
    onChange({
      tamanho: nextTamanho,
      cor: nextCor,
      variant: findVariant(variantes, nextTamanho, nextCor),
    });
  }

  let stockLabel = "Selecione tamanho e cor";
  if (tamanho && cor) {
    if (!selected) {
      stockLabel = "Combinação indisponível";
    } else if (selected.estoque <= 0) {
      stockLabel = "Esgotado";
    } else if (selected.estoque === 1) {
      stockLabel = "1 disponível";
    } else {
      stockLabel = `${selected.estoque} disponíveis`;
    }
  }

  return (
    <div className="product-variants">
      <div className="product-variants__group">
        <p className="product-variants__label">Tamanho</p>
        <div className="product-variants__chips" role="group" aria-label="Tamanhos">
          {tamanhos.map((t) => {
            const available = isTamanhoAvailable(variantes, t, cor);
            const existsAlone = variantes.some(
              (v) => v.tamanho.trim().toLowerCase() === t.trim().toLowerCase(),
            );
            const isActive = tamanho === t;
            const soldOut = existsAlone && !available;
            return (
              <button
                key={t}
                type="button"
                className={[
                  "product-variants__chip",
                  isActive ? "product-variants__chip--active" : "",
                  soldOut ? "product-variants__chip--soldout" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isActive}
                aria-label={
                  soldOut ? `Tamanho ${t}, esgotado` : `Tamanho ${t}`
                }
                onClick={() => selectTamanho(t)}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="product-variants__group">
        <p className="product-variants__label">Cor</p>
        <div className="product-variants__chips" role="group" aria-label="Cores">
          {cores.map((c) => {
            const available = isCorAvailable(variantes, c, tamanho);
            const existsAlone = variantes.some(
              (v) => v.cor.trim().toLowerCase() === c.trim().toLowerCase(),
            );
            const isActive = cor === c;
            const soldOut = existsAlone && !available;
            return (
              <button
                key={c}
                type="button"
                className={[
                  "product-variants__chip",
                  isActive ? "product-variants__chip--active" : "",
                  soldOut ? "product-variants__chip--soldout" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isActive}
                aria-label={soldOut ? `Cor ${c}, esgotada` : `Cor ${c}`}
                onClick={() => selectCor(c)}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <ProductQuantityStepper
        value={quantidade}
        max={qtyEnabled ? stockMax : 0}
        disabled={!qtyEnabled}
        onChange={onQuantidadeChange}
      />

      <p
        className={[
          "product-variants__stock",
          selected && selected.estoque <= 0
            ? "product-variants__stock--out"
            : "",
          selected && selected.estoque > 0
            ? "product-variants__stock--ok"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {stockLabel}
      </p>
    </div>
  );
}
