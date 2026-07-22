import Link from "next/link";
import type { NotFoundProps } from "../types";
import styles from "./gallery.module.css";

export function GalleryNotFound({ site }: NotFoundProps) {
  return (
    <section className={`container ${styles.notFound}`} aria-labelledby="not-found-title">
      <h1 id="not-found-title" className={styles.notFoundTitle}>
        Página não encontrada
      </h1>
      <p className={styles.notFoundCopy}>
        O conteúdo pode ter sido removido da {site.nomeLoja}.
      </p>
      <div className={styles.notFoundCtas}>
        <Link className={`btn ${styles.notFoundBtnPrimary}`} href="/">
          Ir para o início
        </Link>
        <Link className={`btn ${styles.notFoundBtnSecondary}`} href="/catalogo">
          Ver catálogo
        </Link>
      </div>
    </section>
  );
}
