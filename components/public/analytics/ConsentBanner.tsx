"use client";

import styles from "./ConsentBanner.module.css";

type Props = {
  onAccept: () => void;
  onDecline: () => void;
};

export function ConsentBanner({ onAccept, onDecline }: Props) {
  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Cookies">
      <p className={styles.text}>
        Usamos cookies anônimos para entender o uso do site. Sem dados pessoais
        até você se identificar no WhatsApp.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.decline} onClick={onDecline}>
          Recusar
        </button>
        <button type="button" className={styles.accept} onClick={onAccept}>
          Aceitar
        </button>
      </div>
    </div>
  );
}
