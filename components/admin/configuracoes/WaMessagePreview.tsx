import styles from "./WhatsAppPanel.module.css";

type Props = {
  label: string;
  text: string;
  note?: string;
  /** When false, omit aria-live (duplicate preview slots). */
  live?: boolean;
};

export function WaMessagePreview({ label, text, note, live = true }: Props) {
  const display = text.trim() || "…";

  return (
    <div
      className={[styles.previewCard, "wa-product-msg__preview", "wa-product-msg__preview--bubble"].join(
        " ",
      )}
      {...(live ? { "aria-live": "polite" as const } : {})}
    >
      <span className="wa-product-msg__preview-label">{label}</span>
      <pre className="wa-product-msg__preview-text">{display}</pre>
      {note ? <p className={styles.previewNote}>{note}</p> : null}
    </div>
  );
}
