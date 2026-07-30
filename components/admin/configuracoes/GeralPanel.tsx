"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { FieldHint } from "@/components/admin/FieldHint";
import { ImageField, type ImageMeta } from "@/components/admin/ImageField";
import { ColorField } from "@/components/admin/configuracoes/ColorField";
import {
  expandHexIfComplete,
  normalizeHexForPicker,
} from "@/components/admin/configuracoes/siteTheme";
import { DashIcon, dashIcons } from "@/components/admin/dashboard/icons";
import {
  formatBrl,
  maskBrlInput,
  mediaUrl,
  parseBrlInput,
} from "@/src/lib/front/format";
import type { SiteConfig } from "@/src/schemas/site-config";
import styles from "./GeralPanel.module.css";

type ColorKey = keyof SiteConfig["cores"];

const COLOR_FIELDS: Array<{
  key: ColorKey;
  label: string;
  hint: string;
  where: string;
}> = [
  {
    key: "primaria",
    label: "Cor primária",
    hint: "Cor de destaque na vitrine (cabeçalho, botões) e acentos do painel admin.",
    where: "Botões e destaques",
  },
  {
    key: "secundaria",
    label: "Cor secundária",
    hint: "Textos fortes, contraste e fundos escuros da vitrine.",
    where: "Textos e cabeçalho",
  },
  {
    key: "fundo",
    label: "Fundo",
    hint: "Cor de fundo principal das páginas.",
    where: "Fundo da página",
  },
  {
    key: "fundoNeutro",
    label: "Fundo neutro",
    hint: "Fundos suaves de seções, cards e áreas secundárias.",
    where: "Cards e seções",
  },
  {
    key: "borda",
    label: "Borda",
    hint: "Linhas e contornos da interface.",
    where: "Contornos",
  },
];

function WhereBadge({ children }: { children: ReactNode }) {
  return <span className={styles.whereBadge}>{children}</span>;
}

function BrandPreview({
  config,
  logoDraft,
}: {
  config: SiteConfig;
  logoDraft: ImageMeta | null;
}) {
  const logoSrc = logoDraft?.previewUrl || mediaUrl(logoDraft?.path);
  const showName =
    !logoDraft || Boolean(config.mostrarNomeComLogo && config.nomeLoja.trim());
  const storeName = config.nomeLoja.trim() || "Nome da loja";
  const signature = config.assinatura.trim();
  const slogan = config.slogan.trim();

  return (
    <aside className={styles.livePreview} aria-live="polite">
      <p className={styles.previewEyebrow}>Prévia ao vivo · Vitrine</p>

      <div className={styles.brandStage}>
        <div className={styles.brandChrome}>
          <span className={styles.chromeDot} aria-hidden />
          <span className={styles.chromeDot} aria-hidden />
          <span className={styles.chromeDot} aria-hidden />
          <span className={styles.chromeUrl}>sua-loja.com</span>
        </div>

        <div className={styles.brandShell}>
          <header className={styles.brandHeader}>
            <div className={styles.brandIdentity}>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt=""
                  className={styles.brandLogo}
                />
              ) : (
                <span className={styles.brandLogoFallback} aria-hidden>
                  {(storeName[0] || "L").toUpperCase()}
                </span>
              )}
              {showName ? (
                <div className={styles.brandText}>
                  <strong className={styles.brandName}>{storeName}</strong>
                  {signature ? (
                    <span className={styles.brandSignature}>{signature}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className={styles.brandNav} aria-hidden>
              <span>Catálogo</span>
              {config.mostrarCarrinho ? (
                <span className={styles.brandCart}>Carrinho</span>
              ) : null}
            </div>
          </header>

          <div className={styles.brandHero}>
            <p className={styles.brandHeroLabel}>Home · slogan</p>
            <p className={styles.brandSlogan}>
              {slogan ||
                "O slogan aparece aqui quando não houver banner na home."}
            </p>
          </div>

          <footer className={styles.brandFooter}>
            <div className={styles.brandFooterBrand}>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className={styles.brandFooterLogo} />
              ) : null}
              <div>
                <strong>{storeName}</strong>
                {signature ? <span>{signature}</span> : null}
              </div>
            </div>
            <span className={styles.brandFooterMeta}>Rodapé</span>
          </footer>
        </div>
      </div>

      <ul className={styles.impactList}>
        <li>
          <WhereBadge>Cabeçalho</WhereBadge>
          Logo{showName ? ", nome" : ""}
          {signature && showName ? " e assinatura" : ""}
        </li>
        <li>
          <WhereBadge>Home</WhereBadge>
          Slogan (se não houver banner)
        </li>
        <li>
          <WhereBadge>Rodapé</WhereBadge>
          Nome e assinatura
        </li>
        <li>
          <WhereBadge>Aba do navegador</WhereBadge>
          Logo como ícone (favicon)
        </li>
      </ul>
    </aside>
  );
}

function CartFlow({ on }: { on: boolean }) {
  const steps = on
    ? [
        { label: "Ícone no cabeçalho", tone: "on" as const },
        { label: "Adicionar ao carrinho", tone: "on" as const },
        { label: "Página /carrinho", tone: "on" as const },
        { label: "Pedido no WhatsApp", tone: "on" as const },
      ]
    : [
        { label: "Sem ícone no cabeçalho", tone: "off" as const },
        { label: "Só WhatsApp por produto", tone: "alt" as const },
        { label: "/carrinho oculto", tone: "off" as const },
        { label: "Pedido em lote inativo", tone: "off" as const },
      ];

  return (
    <ol className={styles.cartFlow} aria-label="O que muda com o carrinho">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={[
            styles.cartStep,
            step.tone === "on"
              ? styles.cartStepOn
              : step.tone === "alt"
                ? styles.cartStepAlt
                : styles.cartStepOff,
          ].join(" ")}
        >
          <span className={styles.cartStepNum} aria-hidden>
            {i + 1}
          </span>
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function ColorsPreview({ cores }: { cores: SiteConfig["cores"] }) {
  const style = {
    "--gp-primary": cores.primaria,
    "--gp-secondary": cores.secundaria,
    "--gp-bg": cores.fundo,
    "--gp-muted": cores.fundoNeutro,
    "--gp-border": cores.borda,
  } as CSSProperties;

  return (
    <aside className={styles.livePreview} aria-live="polite" style={style}>
      <p className={styles.previewEyebrow}>Prévia ao vivo · Cores</p>
      <div className={styles.colorStage}>
        <div className={styles.colorShell}>
          <header className={styles.colorHeader}>
            <strong>Minha loja</strong>
            <span>Menu</span>
          </header>
          <div className={styles.colorBody}>
            <article className={styles.colorCard}>
              <div className={styles.colorThumb} />
              <p className={styles.colorTitle}>Produto em destaque</p>
              <p className={styles.colorText}>Texto e contornos da vitrine</p>
              <span className={styles.colorCta}>Comprar</span>
            </article>
          </div>
        </div>
      </div>
      <ul className={styles.colorLegend}>
        {COLOR_FIELDS.map((field) => (
          <li key={field.key}>
            <span
              className={styles.colorSwatch}
              style={{ background: cores[field.key] }}
              aria-hidden
            />
            <span>
              <strong>{field.label}</strong>
              <em>{field.where}</em>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function MetaPreview({ mensal }: { mensal: number | null }) {
  if (mensal == null || mensal <= 0) {
    return (
      <aside className={styles.livePreview} aria-live="polite">
        <p className={styles.previewEyebrow}>Prévia · Painel admin</p>
        <div className={styles.metaEmpty}>
          <DashIcon icon={dashIcons.meta} className={styles.metaEmptyIcon} />
          <p className={styles.metaEmptyTitle}>Meta oculta</p>
          <p className={styles.previewEmpty}>
            Sem valor, o bloco de progresso <strong>não aparece</strong> na aba
            Negócio do Painel. A vitrine dos clientes não é afetada.
          </p>
        </div>
      </aside>
    );
  }

  const diasNoMes = 30;
  const diasExemplo = 15;
  const proporcional = (mensal * diasExemplo) / diasNoMes;
  const receitaExemplo = proporcional * 0.68;
  const pct = Math.min((receitaExemplo / proporcional) * 100, 100);

  return (
    <aside className={styles.livePreview} aria-live="polite">
      <p className={styles.previewEyebrow}>Prévia · Painel admin</p>
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
        Só aparece no Painel (aba Negócio). Valores ilustrativos para 15 dias no
        mês.
      </p>
    </aside>
  );
}

export function GeralPanel({
  formId,
  config,
  logoDraft,
  disabled,
  onSubmit,
  onConfigChange,
  onLogoChange,
}: {
  formId: string;
  config: SiteConfig;
  logoDraft: ImageMeta | null;
  disabled?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConfigChange: (next: SiteConfig) => void;
  onLogoChange: (next: ImageMeta | null) => void;
}) {
  const meta = config.metaReceitaMensal ?? null;
  const [metaDraft, setMetaDraft] = useState(
    meta != null ? formatBrl(meta) : "",
  );
  const cartOn = Boolean(config.mostrarCarrinho);

  useEffect(() => {
    setMetaDraft(meta != null ? formatBrl(meta) : "");
  }, [meta]);

  function setColor(key: ColorKey, hex: string) {
    const current = config.cores[key];
    if (current === hex) return;
    if (
      expandHexIfComplete(current) !== null &&
      normalizeHexForPicker(current) === normalizeHexForPicker(hex)
    ) {
      return;
    }
    onConfigChange({
      ...config,
      cores: { ...config.cores, [key]: hex },
    });
  }

  function commitMeta(raw: string) {
    const parsed = parseBrlInput(raw);
    onConfigChange({
      ...config,
      metaReceitaMensal: parsed,
    });
  }

  return (
    <div className={styles.shell}>
      <div className={styles.guide} aria-label="Como configurar a identidade">
        <p className={styles.guideTitle}>Como funciona</p>
        <ol className={styles.guideSteps}>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              1
            </span>
            <span>
              <strong>Marca</strong> — logo, nome e textos que aparecem no
              cabeçalho, home e rodapé.
            </span>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              2
            </span>
            <span>
              <strong>Carrinho</strong> — decide se o cliente monta pedido na
              loja ou fala só pelo WhatsApp.
            </span>
          </li>
          <li className={styles.guideStep}>
            <span className={styles.guideNum} aria-hidden>
              3
            </span>
            <span>
              <strong>Cores e meta</strong> — paleta da vitrine e meta só do
              Painel admin.
            </span>
          </li>
        </ol>
      </div>

      <form
        id={formId}
        onSubmit={onSubmit}
        className={[
          "admin-form",
          "admin-form--sections",
          styles.form,
          disabled ? "admin-form--busy" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-busy={disabled || undefined}
      >
        <section className={`admin-form__section ${styles.section}`}>
          <header className="admin-form__section-header">
            <h2 className="admin-form__section-title">
              Marca
              <FieldHint text="Logo, nome e textos de identidade exibidos na vitrine." />
            </h2>
            <p className="admin-form__section-desc">
              O que o cliente vê primeiro: no topo da loja, na home e no rodapé.
              A prévia ao lado atualiza enquanto você digita.
            </p>
          </header>

          <div className={`admin-form__section-body ${styles.sectionSplit}`}>
            <div className={styles.editCol}>
              <div className={styles.fieldBlock}>
                <span className="admin-field-label">
                  Logo da loja
                  <FieldHint text="Exibida no cabeçalho, rodapé e como ícone da aba do navegador." />
                </span>
                <p className={styles.fieldHelp}>
                  Aparece no <strong>cabeçalho</strong>, no{" "}
                  <strong>rodapé</strong> e como ícone da aba do navegador.
                </p>
                <ImageField
                  dominio="site"
                  value={logoDraft}
                  onChange={onLogoChange}
                  disabled={disabled}
                  label="Logo"
                  showAlt={false}
                  showRemove
                />
              </div>

              <div className={styles.fieldBlock}>
                <div className="admin-field-label">
                  Nome da loja
                  <FieldHint text="Cabeçalho, rodapé, home e título das páginas na vitrine. Com logo carregada, o switch controla se o nome também aparece no cabeçalho." />
                  <label
                    className="admin-switch"
                    data-disabled={!logoDraft || disabled ? "true" : undefined}
                    title={
                      logoDraft
                        ? "Mostrar o nome junto da logo no cabeçalho"
                        : "Disponível quando houver logo da loja"
                    }
                  >
                    <span>Mostrar no cabeçalho</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={Boolean(logoDraft && config.mostrarNomeComLogo)}
                      disabled={!logoDraft || disabled}
                      aria-label="Mostrar nome da loja no cabeçalho quando houver logo"
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          mostrarNomeComLogo: e.target.checked,
                        })
                      }
                    />
                    <span className="admin-switch__track" aria-hidden="true" />
                  </label>
                </div>
                <p className={styles.fieldHelp}>
                  {logoDraft
                    ? config.mostrarNomeComLogo
                      ? "Com a opção ligada, o nome aparece ao lado da logo no cabeçalho."
                      : "Com a opção desligada, só a logo aparece no cabeçalho (o nome segue no rodapé)."
                    : "Sem logo, o nome sempre aparece no cabeçalho. Envie uma logo para poder ocultá-lo."}
                </p>
                <input
                  className="input"
                  value={config.nomeLoja}
                  disabled={disabled}
                  onChange={(e) =>
                    onConfigChange({ ...config, nomeLoja: e.target.value })
                  }
                />
              </div>

              <label className={styles.fieldBlock}>
                <span className="admin-field-label">
                  Assinatura
                  <FieldHint text="Linha sob o nome no cabeçalho e no rodapé." />
                </span>
                <p className={styles.fieldHelp}>
                  Linha curta sob o nome — no <strong>cabeçalho</strong> e no{" "}
                  <strong>rodapé</strong>.
                </p>
                <input
                  className="input"
                  value={config.assinatura}
                  disabled={disabled}
                  placeholder="Ex.: Catálogo online"
                  onChange={(e) =>
                    onConfigChange({ ...config, assinatura: e.target.value })
                  }
                />
              </label>

              <label className={styles.fieldBlock}>
                <span className="admin-field-label">
                  Slogan
                  <FieldHint text="Meta description do site e texto do hero na home (se não houver banner)." />
                </span>
                <p className={styles.fieldHelp}>
                  Texto de boas-vindas na <strong>home</strong> (quando não
                  houver banner) e descrição usada pelo Google.
                </p>
                <textarea
                  className="textarea"
                  rows={2}
                  value={config.slogan}
                  disabled={disabled}
                  onChange={(e) =>
                    onConfigChange({ ...config, slogan: e.target.value })
                  }
                />
              </label>
            </div>

            <BrandPreview config={config} logoDraft={logoDraft} />
          </div>
        </section>

        <section
          className={`admin-form__section ${styles.section} ${styles.cartSection}`}
        >
          <header className="admin-form__section-header">
            <h2 className="admin-form__section-title">
              Carrinho na loja
              <FieldHint text="Configuração global da vitrine. Também habilita ou desativa a mensagem de pedido pelo carrinho no WhatsApp." />
            </h2>
            <p className="admin-form__section-desc">
              Escolha como o cliente fecha o pedido: montando um carrinho na
              loja ou falando produto a produto no WhatsApp.
            </p>
          </header>

          <div className={`admin-form__section-body ${styles.cartBody}`}>
            <div
              className={[
                styles.cartDecision,
                cartOn ? styles.cartDecisionOn : styles.cartDecisionOff,
              ].join(" ")}
            >
              <div className={styles.cartDecisionHead}>
                <div>
                  <p className={styles.cartStatusLabel}>
                    {cartOn ? "Carrinho ligado" : "Carrinho desligado"}
                  </p>
                  <p className={styles.cartStatusDesc}>
                    {cartOn
                      ? "O cliente adiciona itens, revisa em /carrinho e envia o pedido pelo WhatsApp."
                      : "Não há carrinho na vitrine. O cliente fala com você pelo WhatsApp em cada produto."}
                  </p>
                </div>
                <label
                  className={`admin-switch ${styles.cartSwitch}`}
                  data-disabled={disabled ? "true" : undefined}
                >
                  <span className={styles.srOnly}>Mostrar carrinho na loja</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={cartOn}
                    disabled={disabled}
                    aria-label="Mostrar carrinho na loja"
                    onChange={(e) =>
                      onConfigChange({
                        ...config,
                        mostrarCarrinho: e.target.checked,
                      })
                    }
                  />
                  <span className="admin-switch__track" aria-hidden="true" />
                </label>
              </div>

              <CartFlow on={cartOn} />

              <div className={styles.cartWhere}>
                <WhereBadge>Cabeçalho</WhereBadge>
                <WhereBadge>Página do produto</WhereBadge>
                <WhereBadge>/carrinho</WhereBadge>
                <WhereBadge>WhatsApp</WhereBadge>
              </div>
            </div>
          </div>
        </section>

        <section className={`admin-form__section ${styles.section}`}>
          <header className="admin-form__section-header">
            <h2 className="admin-form__section-title">
              Cores
              <FieldHint text="Paleta aplicada à vitrine e ao painel. A pré-visualização é ao vivo." />
            </h2>
            <p className="admin-form__section-desc">
              A paleta pinta a loja e também os acentos do painel. Mude uma cor e
              veja o efeito na miniatura.
            </p>
          </header>

          <div className={`admin-form__section-body ${styles.sectionSplit}`}>
            <div className={styles.editCol}>
              <div className={styles.colorGrid}>
                {COLOR_FIELDS.map((field) => (
                  <div key={field.key} className={styles.colorFieldWrap}>
                    <ColorField
                      label={field.label}
                      hint={field.hint}
                      value={config.cores[field.key]}
                      disabled={disabled}
                      onCommit={(hex) => setColor(field.key, hex)}
                    />
                    <p className={styles.fieldHelp}>{field.where}</p>
                  </div>
                ))}
              </div>
            </div>
            <ColorsPreview cores={config.cores} />
          </div>
        </section>

        <section className={`admin-form__section ${styles.section}`}>
          <header className="admin-form__section-header">
            <h2 className="admin-form__section-title">
              Meta de receita
              <FieldHint text="Valor mensal usado no Painel admin (aba Negócio). Deixe vazio para ocultar." />
            </h2>
            <p className="admin-form__section-desc">
              Só para você no Painel admin — a loja dos clientes{" "}
              <strong>não mostra</strong> esse valor. O progresso é proporcional
              aos dias do período escolhido.
            </p>
          </header>

          <div className={`admin-form__section-body ${styles.sectionSplit}`}>
            <div className={styles.editCol}>
              <label className={`${styles.fieldBlock} ${styles.metaField}`}>
                <span className="admin-field-label">
                  Meta mensal (R$)
                  <FieldHint text="Deixe vazio para não exibir meta no Painel." />
                </span>
                <p className={styles.fieldHelp}>
                  Aparece na aba <strong>Negócio</strong> do Painel. Vazio =
                  bloco oculto.
                </p>
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
              <div className={styles.metaWhere}>
                <WhereBadge>Painel · Negócio</WhereBadge>
                <span className={styles.metaWhereNote}>
                  Não aparece na vitrine pública
                </span>
              </div>
            </div>
            <MetaPreview mensal={meta} />
          </div>
        </section>
      </form>
    </div>
  );
}
