import type { ProductVariant } from "@/src/schemas/product";

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function uniqueTamanhos(variantes: ProductVariant[]): string[] {
  return uniquePreserveOrder(variantes.map((v) => v.tamanho));
}

export function uniqueCores(variantes: ProductVariant[]): string[] {
  return uniquePreserveOrder(variantes.map((v) => v.cor));
}

export function findVariant(
  variantes: ProductVariant[],
  tamanho: string | null,
  cor: string | null,
): ProductVariant | null {
  if (!tamanho || !cor) return null;
  const t = tamanho.trim().toLowerCase();
  const c = cor.trim().toLowerCase();
  return (
    variantes.find(
      (v) =>
        v.tamanho.trim().toLowerCase() === t &&
        v.cor.trim().toLowerCase() === c,
    ) ?? null
  );
}

/** True if there is at least one in-stock variant for this size (optionally filtered by color). */
export function isTamanhoAvailable(
  variantes: ProductVariant[],
  tamanho: string,
  cor: string | null,
): boolean {
  const t = tamanho.trim().toLowerCase();
  return variantes.some((v) => {
    if (v.tamanho.trim().toLowerCase() !== t) return false;
    if (cor && v.cor.trim().toLowerCase() !== cor.trim().toLowerCase()) {
      return false;
    }
    return v.estoque > 0;
  });
}

/** True if there is at least one in-stock variant for this color (optionally filtered by size). */
export function isCorAvailable(
  variantes: ProductVariant[],
  cor: string,
  tamanho: string | null,
): boolean {
  const c = cor.trim().toLowerCase();
  return variantes.some((v) => {
    if (v.cor.trim().toLowerCase() !== c) return false;
    if (
      tamanho &&
      v.tamanho.trim().toLowerCase() !== tamanho.trim().toLowerCase()
    ) {
      return false;
    }
    return v.estoque > 0;
  });
}

/** Combination exists in the product matrix (regardless of stock). */
export function combinationExists(
  variantes: ProductVariant[],
  tamanho: string,
  cor: string,
): boolean {
  return findVariant(variantes, tamanho, cor) != null;
}
