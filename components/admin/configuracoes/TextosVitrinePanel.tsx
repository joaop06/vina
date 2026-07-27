"use client";

import type { SiteConfig } from "@/src/schemas/site-config";

function TextField({
  label,
  value,
  disabled,
  onChange,
  rows = 1,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const Tag = rows > 1 ? "textarea" : "input";
  return (
    <label className="admin-form__field">
      <span className="admin-field-label">{label}</span>
      <Tag
        className={rows > 1 ? "textarea" : "input"}
        rows={rows > 1 ? rows : undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TextosVitrinePanel({
  formId,
  config,
  disabled,
  onSubmit,
  onConfigChange,
}: {
  formId: string;
  config: SiteConfig;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const t = config.textos;

  function patchTextos(partial: Partial<SiteConfig["textos"]>) {
    onConfigChange({ ...config, textos: { ...t, ...partial } });
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className={[
        "admin-form",
        "admin-form--sections",
        disabled ? "admin-form--busy" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Páginas</h2>
        </header>
        <div className="admin-form__section-body">
          <TextField
            label="Título do catálogo"
            value={t.paginas.catalogoTitulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ paginas: { ...t.paginas, catalogoTitulo: v } })
            }
          />
          <TextField
            label="Título Sobre (aba)"
            value={t.paginas.sobreTitulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ paginas: { ...t.paginas, sobreTitulo: v } })
            }
          />
          <TextField
            label="Título carrinho"
            value={t.paginas.carrinhoTitulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ paginas: { ...t.paginas, carrinhoTitulo: v } })
            }
          />
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Home</h2>
        </header>
        <div className="admin-form__section-body">
          <TextField
            label="Destaques"
            value={t.home.destaquesTitulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ home: { ...t.home, destaquesTitulo: v } })
            }
          />
          <TextField
            label="Lançamentos"
            value={t.home.lancamentosTitulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ home: { ...t.home, lancamentosTitulo: v } })
            }
          />
          <TextField
            label="CTA hero (ver coleção)"
            value={t.home.verColecao}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ home: { ...t.home, verColecao: v } })
            }
          />
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Produto e carrinho</h2>
        </header>
        <div className="admin-form__section-body">
          <TextField
            label="Badge novo"
            value={t.produto.badgeNovo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ produto: { ...t.produto, badgeNovo: v } })
            }
          />
          <TextField
            label="CTA WhatsApp (interesse)"
            value={t.produto.ctaInteresse}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ produto: { ...t.produto, ctaInteresse: v } })
            }
          />
          <TextField
            label="CTA carrinho"
            value={t.produto.ctaCarrinho}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ produto: { ...t.produto, ctaCarrinho: v } })
            }
          />
          <TextField
            label="Título carrinho (página)"
            value={t.carrinho.titulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ carrinho: { ...t.carrinho, titulo: v } })
            }
          />
        </div>
      </section>

      <section className="admin-form__section">
        <header className="admin-form__section-header">
          <h2 className="admin-form__section-title">Cookies e lead WhatsApp</h2>
        </header>
        <div className="admin-form__section-body">
          <TextField
            label="Mensagem cookies"
            value={t.cookies.mensagem}
            disabled={disabled}
            rows={3}
            onChange={(v) =>
              patchTextos({ cookies: { ...t.cookies, mensagem: v } })
            }
          />
          <TextField
            label="Título modal lead"
            value={t.leadModal.titulo}
            disabled={disabled}
            onChange={(v) =>
              patchTextos({ leadModal: { ...t.leadModal, titulo: v } })
            }
          />
        </div>
      </section>
    </form>
  );
}
