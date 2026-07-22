import type { BannerPosicao } from "@/src/schemas/banner";
import type { SiteLayoutId } from "@/src/schemas/site-config";

export type LayoutBannerSlot = {
  posicao: BannerPosicao;
  label: string;
  hint: string;
  maxItems: number;
  required: boolean;
};

export const LAYOUT_BANNER_SLOTS: Record<SiteLayoutId, LayoutBannerSlot[]> = {
  classic: [
    {
      posicao: "hero",
      label: "Topo da loja",
      hint: "Imagem de fundo no topo da página inicial. Dimensão ideal: 1920 × 800 px.",
      maxItems: 1,
      required: false,
    },
    {
      posicao: "faixa",
      label: "Faixa intermediária",
      hint: "Faixa larga no meio da página. Dimensão ideal: 1200 × 360 px.",
      maxItems: 1,
      required: false,
    },
    {
      posicao: "promo",
      label: "Promoção",
      hint: "Bloco de oferta perto do final da página. Dimensão ideal: 1200 × 675 px (16:9).",
      maxItems: 1,
      required: false,
    },
  ],
  split: [
    {
      posicao: "hero",
      label: "Topo da loja",
      hint: "Painel visual à direita do hero. Prefira retrato ou quadrado. Ideal: 1200 × 1400 px.",
      maxItems: 1,
      required: false,
    },
    {
      posicao: "faixa",
      label: "Faixa intermediária",
      hint: "Faixa larga no meio da página. Dimensão ideal: 1200 × 360 px.",
      maxItems: 1,
      required: false,
    },
    {
      posicao: "promo",
      label: "Promoção",
      hint: "Bloco de oferta perto do final da página. Dimensão ideal: 1200 × 675 px (16:9).",
      maxItems: 1,
      required: false,
    },
  ],
  gallery: [
    {
      posicao: "hero",
      label: "Carrossel da home",
      hint: "Slides do carrossel no topo. Dimensão ideal: 1920 × 1080 px. Até 6 imagens.",
      maxItems: 6,
      required: false,
    },
  ],
};

export function getBannerSlotsForLayout(
  layout: SiteLayoutId | undefined | null,
): LayoutBannerSlot[] {
  if (layout && layout in LAYOUT_BANNER_SLOTS) {
    return LAYOUT_BANNER_SLOTS[layout];
  }
  return LAYOUT_BANNER_SLOTS.classic;
}

export function getSlotDef(
  layout: SiteLayoutId | undefined | null,
  posicao: BannerPosicao,
): LayoutBannerSlot | undefined {
  return getBannerSlotsForLayout(layout).find((s) => s.posicao === posicao);
}
