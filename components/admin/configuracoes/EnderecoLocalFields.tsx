"use client";

import { useEffect, useRef, useState } from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import {
  formatCep,
  formatEnderecoLinha,
  normalizeCep,
  syncEnderecoTexto,
} from "@/src/lib/br/endereco";
import { fetchEnderecoByCep, ViaCepError } from "@/src/lib/br/viacep";
import type { SiteConfig } from "@/src/schemas/site-config";

type Endereco = SiteConfig["endereco"];

function patchEndereco(
  config: SiteConfig,
  patch: Partial<Endereco>,
  onConfigChange: (next: SiteConfig) => void,
) {
  onConfigChange({
    ...config,
    endereco: syncEnderecoTexto({ ...config.endereco, ...patch }),
  });
}

export function EnderecoLocalFields({
  config,
  disabled,
  onConfigChange,
}: {
  config: SiteConfig;
  disabled?: boolean;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const [cepError, setCepError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  const lastLookupCepRef = useRef("");
  configRef.current = config;

  const cepDigits = normalizeCep(config.endereco.cep);
  const preview = formatEnderecoLinha(config.endereco);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCepError(null);

    if (cepDigits.length !== 8 || disabled) {
      abortRef.current?.abort();
      setBuscando(false);
      return;
    }

    if (lastLookupCepRef.current === cepDigits) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setBuscando(true);

      fetchEnderecoByCep(cepDigits, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          const prev = configRef.current.endereco;
          onConfigChange({
            ...configRef.current,
            endereco: syncEnderecoTexto({
              ...prev,
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.cidade,
              uf: data.uf,
              complemento: prev.complemento.trim()
                ? prev.complemento
                : data.complemento,
            }),
          });
          lastLookupCepRef.current = cepDigits;
          setCepError(null);
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setCepError(
            e instanceof ViaCepError ? e.message : "Erro ao buscar CEP",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscando(false);
        });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cepDigits, disabled, onConfigChange]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      <div className="admin-form__field">
        <div className="admin-field-label">
          Endereço da loja
          <FieldHint text="Preencha o CEP para buscar rua e bairro. Informe número e complemento para o endereço completo na vitrine." />
          <label
            className="admin-switch"
            data-disabled={disabled ? "true" : undefined}
          >
            <span>Mostrar no rodapé</span>
            <input
              type="checkbox"
              role="switch"
              checked={Boolean(config.endereco.mostrar)}
              disabled={disabled}
              aria-label="Mostrar endereço no rodapé"
              onChange={(e) =>
                patchEndereco(
                  config,
                  { mostrar: e.target.checked },
                  onConfigChange,
                )
              }
            />
            <span className="admin-switch__track" aria-hidden="true" />
          </label>
        </div>

        <span className="admin-field-label">CEP</span>
        <input
          className="input admin-config-input--sm"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          disabled={disabled}
          value={formatCep(config.endereco.cep)}
          aria-describedby={
            cepError ? "endereco-cep-error" : buscando ? "endereco-cep-busy" : undefined
          }
          onChange={(e) => {
            setCepError(null);
            const cep = normalizeCep(e.target.value);
            if (cep !== normalizeCep(config.endereco.cep)) {
              lastLookupCepRef.current = "";
            }
            patchEndereco(config, { cep }, onConfigChange);
          }}
        />
        {buscando ? (
          <p className="admin-form__section-desc" id="endereco-cep-busy">
            Buscando endereço…
          </p>
        ) : null}
        {cepError ? (
          <p className="admin-alert" id="endereco-cep-error" role="alert">
            {cepError}
          </p>
        ) : null}
      </div>

      <label className="admin-form__span">
        <span className="admin-field-label">Logradouro</span>
        <input
          className="input"
          disabled={disabled}
          autoComplete="street-address"
          value={config.endereco.logradouro}
          onChange={(e) =>
            patchEndereco(
              config,
              { logradouro: e.target.value },
              onConfigChange,
            )
          }
        />
      </label>

      <div className="admin-form__row admin-form__row--2">
        <label>
          <span className="admin-field-label">Número</span>
          <input
            className="input"
            disabled={disabled}
            inputMode="numeric"
            placeholder="123"
            value={config.endereco.numero}
            onChange={(e) =>
              patchEndereco(config, { numero: e.target.value }, onConfigChange)
            }
          />
        </label>
        <label>
          <span className="admin-field-label">Complemento</span>
          <input
            className="input"
            disabled={disabled}
            placeholder="Sala, loja…"
            value={config.endereco.complemento}
            onChange={(e) =>
              patchEndereco(
                config,
                { complemento: e.target.value },
                onConfigChange,
              )
            }
          />
        </label>
      </div>

      <label className="admin-form__span">
        <span className="admin-field-label">Bairro</span>
        <input
          className="input"
          disabled={disabled}
          value={config.endereco.bairro}
          onChange={(e) =>
            patchEndereco(config, { bairro: e.target.value }, onConfigChange)
          }
        />
      </label>

      <div className="admin-form__row admin-form__row--2">
        <label>
          <span className="admin-field-label">Cidade</span>
          <input
            className="input"
            disabled={disabled}
            value={config.endereco.cidade}
            onChange={(e) =>
              patchEndereco(config, { cidade: e.target.value }, onConfigChange)
            }
          />
        </label>
        <label>
          <span className="admin-field-label">UF</span>
          <input
            className="input admin-config-input--xs"
            disabled={disabled}
            maxLength={2}
            value={config.endereco.uf}
            onChange={(e) =>
              patchEndereco(
                config,
                { uf: e.target.value.toUpperCase() },
                onConfigChange,
              )
            }
          />
        </label>
      </div>

      {preview ? (
        <p className="admin-form__section-desc">
          Prévia no site: {preview}
        </p>
      ) : null}
    </>
  );
}
