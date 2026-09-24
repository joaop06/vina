import type { LayoutPreviewProps } from "../contract/types";
import styles from "./preview.module.css";

export function AteliePreview({
  viewport,
  storeName,
  heroSrc,
  heroes,
}: LayoutPreviewProps) {
  const cover = heroes[0]?.src ?? heroSrc;
  const mobile = viewport === "mobile";

  return (
    <section className={[styles.hero, mobile ? styles.heroMobile : ""].filter(Boolean).join(" ")}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Assinatura</span>
        <strong className={styles.title}>{storeName || "Minha loja"}</strong>
        <span className={styles.lead}>Slogan da loja</span>
        <span className={styles.actions}>
          <span className={styles.btnFill}>Catálogo</span>
          <span className={styles.btnOutline}>WhatsApp</span>
        </span>
      </div>
      <div className={styles.frame}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className={styles.image} />
        ) : (
          <span className={styles.empty}>Foto ou vídeo</span>
        )}
      </div>
    </section>
  );
}
