import type { LayoutPreviewProps } from "../contract/types";
import styles from "./preview.module.css";

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
      className={[styles.marker, empty ? styles.markerEmpty : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.markerStep}>{step}</span>
      {label}
      {empty ? " · vazio" : ""}
    </span>
  );
}

export function GalleryPreview({
  viewport,
  storeName,
  heroSrc,
  heroes,
}: LayoutPreviewProps) {
  const cta = heroes[0]?.cta?.trim() || "Ver coleção";
  const cover = heroes[0]?.src ?? heroSrc;

  return (
    <section
      className={[
        styles.galleryHero,
        viewport === "mobile" ? styles.galleryHeroMobile : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {heroes.length > 0 && cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className={styles.coverImg} />
      ) : (
        <div className={styles.classicGradient} />
      )}
      <div className={styles.classicScrim} />
      <div className={styles.classicCopy}>
        <Marker label="Carrossel" step={1} empty={heroes.length === 0} />
        <strong>{storeName || "Minha loja"}</strong>
        <span className={styles.ctaChip}>{cta}</span>
        {heroes.length > 1 ? (
          <div className={styles.dots} aria-hidden>
            {heroes.slice(0, 6).map((slide, i) => (
              <span
                key={slide.id}
                className={`${styles.dot}${i === 0 ? ` ${styles.dotActive}` : ""}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
