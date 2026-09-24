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

function Placeholder({ label }: { label: string }) {
  return (
    <div className={styles.placeholder}>
      <span>{label}</span>
    </div>
  );
}

export function SplitPreview({
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
        styles.splitHero,
        viewport === "mobile" ? styles.splitHeroStack : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.splitCopy}>
        <Marker label="Topo" step={slotIndex("hero") || 1} empty={!heroSrc} />
        <strong>{storeName || "Minha loja"}</strong>
        <span className={styles.ctaChip}>{cta}</span>
      </div>
      <div className={styles.splitVisual}>
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroSrc} alt="" className={styles.coverImg} />
        ) : (
          <Placeholder label="Imagem do topo" />
        )}
      </div>
    </section>
  );
}
