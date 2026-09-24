"use client";

import type { Banner, BannerPosicao, SiteLayoutId } from "@/src/schemas";
import { useMemo, useState, type CSSProperties } from "react";
import { mediaUrl } from "@/src/foundation/behaviors/media/format";
import { DEFAULT_BANNER_CTA } from "@/src/config/store-copy-defaults";
import { getLayout } from "@/components/public/layouts";
import { getBannerSlotsForLayout } from "@/components/public/layouts/contract/banner-slots";
import styles from "./VitrinePreview.module.css";

type Viewport = "desktop" | "mobile";

function activeByPosicao(
  banners: Banner[],
  posicao: BannerPosicao,
): Banner[] {
  return banners
    .filter((b) => b.posicao === posicao && b.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

function bannerSrc(banner: Banner | undefined): string | null {
  return banner ? mediaUrl(banner.imagem.path) : null;
}

function Marker({
  label,
  step,
  empty,
}: {
  label: string;
  step: number;
  empty?: boolean;
}) {
  return (
    <span
      className={[
        styles.marker,
        empty ? styles.markerEmpty : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.markerStep}>{step}</span>
      {label}
      {empty ? " · vazio" : ""}
    </span>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className={styles.placeholder}>
      <span>{label}</span>
    </div>
  );
}

export function VitrinePreview({
  layout,
  banners,
  storeName,
  primaryColor,
  live = false,
}: {
  layout: SiteLayoutId;
  banners: Banner[];
  storeName: string;
  primaryColor: string;
  live?: boolean;
}) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const slots = useMemo(() => getBannerSlotsForLayout(layout), [layout]);

  const heroes = activeByPosicao(banners, "hero");
  const faixa = activeByPosicao(banners, "faixa")[0];
  const promo = activeByPosicao(banners, "promo")[0];
  const hero = heroes[0];
  const heroSrc = bannerSrc(hero);
  const faixaSrc = bannerSrc(faixa);
  const promoSrc = bannerSrc(promo);

  const slotIndex = (posicao: BannerPosicao) =>
    slots.findIndex((s) => s.posicao === posicao) + 1;
  const showsFaixaPromo = slots.some(
    (slot) => slot.posicao === "faixa" || slot.posicao === "promo",
  );

  const Preview = getLayout(layout).Preview;
  const previewHeroes = heroes.map((slide) => ({
    id: slide.id,
    src: bannerSrc(slide),
    cta: slide.ctaTexto?.trim() || "Ver coleção",
  }));

  const style = {
    "--preview-primary": primaryColor,
  } as CSSProperties;

  return (
    <div
      className={[styles.root, live ? styles.rootLive : ""].filter(Boolean).join(" ")}
      style={style}
      aria-hidden={!live ? true : undefined}
    >
      <div className={styles.toolbar}>
        <p className={styles.label}>Prévia da home</p>
        <div className={styles.viewportToggle} role="group" aria-label="Tamanho da prévia">
          <button
            type="button"
            className={`${styles.viewportBtn}${viewport === "desktop" ? ` ${styles.viewportBtnActive}` : ""}`}
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
            tabIndex={live ? undefined : -1}
          >
            Desktop
          </button>
          <button
            type="button"
            className={`${styles.viewportBtn}${viewport === "mobile" ? ` ${styles.viewportBtnActive}` : ""}`}
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
            tabIndex={live ? undefined : -1}
          >
            Celular
          </button>
        </div>
      </div>

      <div
        className={[
          styles.stage,
          viewport === "mobile" ? styles.stageMobile : styles.stageDesktop,
        ].join(" ")}
      >
        <div className={styles.shell}>
          <header className={styles.chrome}>
            <strong className={styles.brand}>{storeName || "Minha loja"}</strong>
            <span className={styles.nav}>Menu</span>
          </header>

          {slots.length === 0 ? null : (
            <>
          {Preview ? (
            <Preview
              viewport={viewport}
              storeName={storeName}
              heroSrc={heroSrc}
              heroes={previewHeroes}
              faixaSrc={faixaSrc}
              promoSrc={promoSrc}
              faixaCta={faixa?.ctaTexto?.trim() || DEFAULT_BANNER_CTA}
              promoCta={promo?.ctaTexto?.trim() || DEFAULT_BANNER_CTA}
              slotIndex={slotIndex}
            />
          ) : null}

          <div className={styles.products}>
            <div className={styles.productCard} />
            <div className={styles.productCard} />
            <div className={styles.productCard} />
          </div>

          {showsFaixaPromo ? (
            <>
              <section className={styles.faixa}>
                <Marker
                  label="Faixa"
                  step={slotIndex("faixa") || 2}
                  empty={!faixaSrc}
                />
                {faixaSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faixaSrc} alt="" className={styles.coverImg} />
                ) : (
                  <Placeholder label="Faixa intermediária" />
                )}
              </section>

              <div className={styles.products}>
                <div className={styles.productCard} />
                <div className={styles.productCard} />
              </div>

              <section className={styles.promo}>
                <div className={styles.promoMedia}>
                  {promoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promoSrc} alt="" className={styles.coverImg} />
                  ) : (
                    <Placeholder label="Promoção" />
                  )}
                </div>
                <div className={styles.promoBody}>
                  <Marker
                    label="Promoção"
                    step={slotIndex("promo") || 3}
                    empty={!promoSrc}
                  />
                  <span className={styles.ctaChip}>
                    {promo?.ctaTexto?.trim() || DEFAULT_BANNER_CTA}
                  </span>
                </div>
              </section>
            </>
          ) : (
            <p className={styles.galleryNote}>
              Neste modelo só o carrossel do topo usa banners. Faixa e promoção
              ficam guardadas e voltam se você mudar de layout.
            </p>
          )}
            </>
          )}
        </div>
      </div>

      {slots.length > 0 ? (
        <p className={styles.note}>
          Os números {slots.map((_, i) => i + 1).join(", ")} batem com as áreas
          abaixo. A prévia usa as imagens ativas já salvas.
        </p>
      ) : null}
    </div>
  );
}
