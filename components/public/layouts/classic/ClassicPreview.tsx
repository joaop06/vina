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

export function ClassicPreview({
  viewport,
  storeName,
  heroSrc,
  heroes,
  slotIndex,
}: LayoutPreviewProps) {
  const cta = heroes[0]?.cta?.trim() || "Ver coleção";

  return (
    <section
      className={[
        styles.classicHero,
        viewport === "mobile" ? styles.classicHeroMobile : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {heroSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroSrc} alt="" className={styles.coverImg} />
      ) : (
        <div className={styles.classicGradient} />
      )}
      <div className={styles.classicScrim} />
      <div className={styles.classicCopy}>
        <Marker label="Topo" step={slotIndex("hero") || 1} empty={!heroSrc} />
        <strong>{storeName || "Minha loja"}</strong>
        <span className={styles.ctaChip}>{cta}</span>
      </div>
    </section>
  );
}
