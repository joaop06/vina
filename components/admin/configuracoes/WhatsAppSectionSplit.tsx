import type { ReactNode } from "react";
import { WaMessagePreview } from "@/components/admin/configuracoes/WaMessagePreview";
import styles from "./WhatsAppPanel.module.css";

type Props = {
  children: ReactNode;
  previewLabel: string;
  previewText: string;
  previewNote?: string;
  previewMuted?: boolean;
};

export function WhatsAppSectionSplit({
  children,
  previewLabel,
  previewText,
  previewNote,
  previewMuted,
}: Props) {
  const previewProps = {
    label: previewLabel,
    text: previewText,
    note: previewNote,
  };

  return (
    <div className={styles.split}>
      <details className={styles.previewMobile}>
        <summary className={styles.previewMobileSummary}>Ver exemplo</summary>
        <div className={styles.previewMobileBody}>
          <WaMessagePreview {...previewProps} live={false} />
        </div>
      </details>

      <div className={styles.edit}>{children}</div>

      <aside
        className={[
          styles.previewAside,
          previewMuted ? styles.previewAsideMuted : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <WaMessagePreview {...previewProps} live />
      </aside>
    </div>
  );
}
