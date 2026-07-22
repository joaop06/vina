"use client";

import { useEffect, useState } from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import { DashIcon, dashIcons } from "@/components/admin/dashboard/icons";
import {
  formatBrl,
  maskBrlInput,
  parseBrlInput,
} from "@/src/lib/front/format";
import type { SiteConfig } from "@/src/schemas/site-config";
import styles from "./PainelPanel.module.css";

type Props = {
  formId: string;
  config: SiteConfig;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
};

function MetaPreview({ mensal }: { mensal: number | null }) {
  if (mensal == null || mensal <= 0) {
    return (
      <aside className={styles.preview} aria-live="polite">
        <p className={styles.previewLabel}>Pré-visualização no Painel</p>
        <p className={styles.previewEmpty}>
          Sem meta definida, o bloco de progresso não aparece na aba Negócio.
        </p>
      </aside>
    );
  }

  const diasNoMes = 30;
  const diasExemplo = 15;
  const proporcional = (mensal * diasExemplo) / diasNoMes;
  const receitaExemplo = proporcional * 0.68;
  const pct = Math.min((receitaExemplo / proporcional) * 100, 100);

  return (
    <aside className={styles.preview} aria-live="polite">
      <p className={styles.previewLabel}>Pré-visualização no Painel</p>
      <div className={styles.previewCard}>
        <DashIcon icon={dashIcons.meta} className={styles.previewIcon} />
        <div className={styles.previewBody}>
          <p className={styles.previewTitle}>
            Meta de receita (proporcional ao período)
          </p>
          <div
            className={styles.previewBar}
            role="img"
            aria-label={`Exemplo: ${pct.toFixed(0)}% da meta proporcional`}
          >
            <div
              className={styles.previewFill}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={styles.previewDetail}>
            <strong>{formatBrl(receitaExemplo)}</strong> de{" "}
            {formatBrl(proporcional)} ({pct.toFixed(0)}%) · meta mensal{" "}
            {formatBrl(mensal)}
          </p>
        </div>
      </div>
      <p className={styles.previewNote}>
        Valores ilustrativos para um período de 15 dias no mês.
      </p>
    </aside>
  );
}

export function PainelPanel({
  formId,
  config,
  disabled,
  onSubmit,
  onConfigChange,
}: Props) {
  const meta = config.painel?.metaReceitaMensal ?? null;
  const [metaDraft, setMetaDraft] = useState(
    meta != null ? formatBrl(meta) : "",
  );

  useEffect(() => {
    setMetaDraft(meta != null ? formatBrl(meta) : "");
  }, [meta]);

  function commitMeta(raw: string) {
    const parsed = parseBrlInput(raw);
    onConfigChange({
      ...config,
      painel: {
        metaReceitaMensal: parsed,
      },
    });
  }

  return (
    <form
      id={formId}
      className={[
        "admin-form",
        "admin-form--sections",
        disabled ? "admin-form--busy" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onSubmit={onSubmit}
      aria-busy={disabled || undefined}
    >
      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Meta de receita</h2>
          <p className="admin-form__section-desc">
            Valor mensal usado no Painel admin (aba Negócio). O progresso é
            calculado de forma proporcional ao número de dias do período
            selecionado em relação ao mês calendário.
          </p>
        </header>
        <div className={`admin-form__section-body ${styles.layout}`}>
          <label className={`admin-form__field ${styles.field}`}>
            <span className="admin-field-label">
              Meta mensal (R$)
              <FieldHint text="Deixe vazio para não exibir meta no Painel." />
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="input"
              placeholder="R$ 0,00"
              value={metaDraft}
              disabled={disabled}
              onChange={(e) => {
                const masked = maskBrlInput(e.target.value);
                setMetaDraft(masked);
                commitMeta(masked);
              }}
              onBlur={() => {
                if (!metaDraft.trim()) {
                  commitMeta("");
                  return;
                }
                commitMeta(metaDraft);
              }}
            />
          </label>
          <MetaPreview mensal={meta} />
        </div>
      </section>
    </form>
  );
}
