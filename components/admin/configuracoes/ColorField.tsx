"use client";

import { useEffect, useState } from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import {
  expandHexIfComplete,
  normalizeHexForPicker,
} from "@/components/admin/configuracoes/siteTheme";

export function ColorField({
  label,
  hint,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  hint: string;
  value: string;
  disabled?: boolean;
  onCommit: (hex: string) => void;
}) {
  const [hexDraft, setHexDraft] = useState(value);
  const pickerValue = normalizeHexForPicker(value);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  return (
    <label className="admin-form__field admin-config-color">
      <span className="admin-field-label">
        {label}
        <FieldHint text={hint} />
      </span>
      <div className="admin-color-field">
        <input
          type="color"
          className="admin-color-field__swatch"
          value={pickerValue}
          disabled={disabled}
          onChange={(e) => {
            const nextPicker = e.target.value.toLowerCase();
            if (nextPicker === pickerValue) return;
            const next = nextPicker.toUpperCase();
            setHexDraft(next);
            onCommit(next);
          }}
          aria-label={`Selecionar ${label.toLowerCase()}`}
        />
        <input
          className="input"
          value={hexDraft}
          spellCheck={false}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            setHexDraft(raw);
            const expanded = expandHexIfComplete(raw);
            if (expanded) onCommit(expanded);
          }}
          onBlur={() => {
            const expanded = expandHexIfComplete(hexDraft);
            if (expanded) {
              setHexDraft(expanded);
              onCommit(expanded);
            } else {
              setHexDraft(value);
            }
          }}
        />
      </div>
    </label>
  );
}
