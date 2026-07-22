import type { Banner } from "@/src/schemas/banner";
import type { Product } from "@/src/schemas/product";

export function bannersByPosicao(
  banners: Banner[],
  posicao: Banner["posicao"],
): Banner[] {
  return banners
    .filter((b) => b.ativo && b.posicao === posicao)
    .sort((a, b) => a.ordem - b.ordem);
}

export function pickBanner(
  banners: Banner[],
  posicao: Banner["posicao"],
): Banner | undefined {
  return bannersByPosicao(banners, posicao)[0];
}

/** Capa = menor `ordem`; desempate estável pelo path. */
export function sortedProductImages(product: Product) {
  return [...product.imagens].sort((a, b) => a.ordem - b.ordem || a.path.localeCompare(b.path));
}

export function coverImage(product: Product) {
  return sortedProductImages(product)[0];
}
