import Link from "next/link";
import type { NotFoundProps } from "../types";
import { FootMark } from "./FootMark";
import styles from "./split.module.css";

export function SplitNotFound({ site }: NotFoundProps) {
  return (
    <section className={styles.notFound} aria-labelledby="not-found-title">
      <div className={`container ${styles.notFoundInner}`}>
        <div className={styles.notFoundCopyBlock}>
          <h1 id="not-found-title" className={styles.notFoundTitle}>
            Página não encontrada
          </h1>
          <p className={styles.notFoundText}>
            O conteúdo pode ter sido removido da {site.nomeLoja}.
          </p>
          <div className={styles.notFoundCtas}>
            <Link className={`btn btn-primary ${styles.notFoundBtnPrimary}`} href="/">
              Ir para o início
            </Link>
            <Link className={`btn btn-dark ${styles.notFoundBtnSecondary}`} href="/catalogo">
              Ver catálogo
            </Link>
          </div>
        </div>
        <div className={styles.notFoundVisual} aria-hidden="true">
          <FootMark className={styles.notFoundMark} />
        </div>
      </div>
    </section>
  );
}
