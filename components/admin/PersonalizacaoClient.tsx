"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageActions } from "@/components/admin/AdminPageActions";
import { useAdminBusy } from "@/components/admin/AdminBusy";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { mutationFetch, assertMutationOk } from "@/components/admin/mutationFetch";
import {
  toastMutationError,
  toastMutationSuccess,
} from "@/components/admin/adminToast";
import {
  buildMutationFormData,
  revokePreviewUrl,
} from "@/components/admin/uploadClient";
import { ContatoPanel } from "@/components/admin/configuracoes/ContatoPanel";
import { WhatsAppPanel } from "@/components/admin/configuracoes/WhatsAppPanel";
import { IdentidadePanel } from "@/components/admin/configuracoes/IdentidadePanel";
import { VitrinePanel } from "@/components/admin/configuracoes/VitrinePanel";
import { NavegacaoPanel } from "@/components/admin/configuracoes/NavegacaoPanel";
import { PainelPanel } from "@/components/admin/configuracoes/PainelPanel";
import {
  configFingerprint,
  logoFromConfig,
  normalizeSiteConfig,
} from "@/components/admin/configuracoes/configDirty";
import {
  CONFIGURACOES_TABS,
  configTabHref,
  parseConfigTab,
  type ConfiguracoesTabId,
} from "@/components/admin/configuracoes/configTabs";
import {
  applySiteTheme,
  normalizeHexForPicker,
} from "@/components/admin/configuracoes/siteTheme";
import type { ImageMeta } from "@/components/admin/ImageField";
import { normalizeWaDigits } from "@/src/lib/wa";
import type { Banner } from "@/src/schemas/banner";
import type { Category } from "@/src/schemas/category";
import { DEFAULT_NAVEGACAO } from "@/src/schemas/navigation";
import type { SiteConfig } from "@/src/schemas/site-config";

function isLeavingConfiguracoes(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return true;
    return !url.pathname.startsWith("/admin/personalizacao");
  } catch {
    return false;
  }
}

export function PersonalizacaoClient({
  initialConfig,
  initialBanners,
  initialCategories,
  initialTab,
}: {
  initialConfig: SiteConfig;
  initialBanners: Banner[];
  initialCategories: Category[];
  initialTab?: string;
}) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<ConfiguracoesTabId>(() =>
    parseConfigTab(initialTab),
  );
  const tabsId = useId();
  const identidadeFormId = useId();
  const contatoFormId = useId();
  const whatsappFormId = useId();
  const vitrineFormId = useId();
  const navegacaoFormId = useId();
  const painelFormId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const allowLeaveRef = useRef(false);

  const [config, setConfig] = useState<SiteConfig>(() =>
    normalizeSiteConfig(initialConfig),
  );
  const [logoDraft, setLogoDraft] = useState<ImageMeta | null>(() =>
    logoFromConfig(initialConfig),
  );
  const [baselineFp, setBaselineFp] = useState(() =>
    configFingerprint(
      normalizeSiteConfig(initialConfig),
      logoFromConfig(initialConfig),
    ),
  );
  const [baselineLayout, setBaselineLayout] = useState(
    () => initialConfig.layout ?? "classic",
  );
  const [saving, setSaving] = useState(false);
  const { runMutation } = useAdminBusy();
  const committedTheme = useRef<Pick<SiteConfig, "cores" | "layout">>({
    cores: initialConfig.cores,
    layout: initialConfig.layout ?? "classic",
  });

  const colorPickerValue = normalizeHexForPicker(config.cores.primaria);
  const selectedLayout = config.layout ?? "classic";
  const isDirty =
    configFingerprint(config, logoDraft) !== baselineFp;

  const activeFormId =
    tab === "contato"
      ? contatoFormId
      : tab === "whatsapp"
        ? whatsappFormId
        : tab === "vitrine"
          ? vitrineFormId
          : tab === "navegacao"
            ? navegacaoFormId
            : tab === "painel"
              ? painelFormId
              : identidadeFormId;

  function selectTab(next: ConfiguracoesTabId) {
    setTab(next);
    router.replace(configTabHref(next), { scroll: false });
  }

  function focusTab(index: number) {
    const next =
      CONFIGURACOES_TABS[
        (index + CONFIGURACOES_TABS.length) % CONFIGURACOES_TABS.length
      ];
    if (!next) return;
    selectTab(next.id);
    tabRefs.current[
      (index + CONFIGURACOES_TABS.length) % CONFIGURACOES_TABS.length
    ]?.focus();
  }

  function onConfigChange(next: SiteConfig) {
    setConfig(next);
  }

  function onLogoChange(next: ImageMeta | null) {
    setLogoDraft(next);
  }

  // Live theme preview; restore committed theme on unmount.
  useEffect(() => {
    applySiteTheme({
      cores: { ...config.cores, primaria: colorPickerValue },
      layout: selectedLayout,
    });
  }, [colorPickerValue, config.cores, selectedLayout]);

  useEffect(() => {
    return () => {
      applySiteTheme(committedTheme.current);
    };
  }, []);

  // Normalize legacy URLs (layout/banners/personalização) to canonical tab.
  useEffect(() => {
    const canonical = parseConfigTab(initialTab);
    if (initialTab && initialTab !== canonical) {
      router.replace(configTabHref(canonical), { scroll: false });
    }
  }, [initialTab, router]);

  useEffect(() => {
    const index = CONFIGURACOES_TABS.findIndex((t) => t.id === tab);
    const el = tabRefs.current[index];
    if (!el) return;
    const mobile = window.matchMedia("(max-width: 767.98px)");
    if (!mobile.matches) return;
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [tab]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const onClickCapture = (e: MouseEvent) => {
      if (allowLeaveRef.current) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const logoutBtn = target.closest(
        ".admin-sidebar__logout",
      ) as HTMLButtonElement | null;
      if (logoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        void (async () => {
          const ok = await confirm({
            title: "Alterações não salvas",
            description:
              "Há alterações em Configurações que ainda não foram salvas. Descartar e sair?",
            confirmLabel: "Descartar",
            cancelLabel: "Continuar editando",
            tone: "danger",
          });
          if (!ok) return;
          allowLeaveRef.current = true;
          logoutBtn.click();
        })();
        return;
      }

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!isLeavingConfiguracoes(href)) return;

      e.preventDefault();
      e.stopPropagation();
      void (async () => {
        const ok = await confirm({
          title: "Alterações não salvas",
          description:
            "Há alterações em Configurações que ainda não foram salvas. Descartar e sair?",
          confirmLabel: "Descartar",
          cancelLabel: "Continuar editando",
          tone: "danger",
        });
        if (!ok) return;
        allowLeaveRef.current = true;
        router.push(href);
      })();
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [isDirty, confirm, router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const pendingFiles = logoDraft?.file
        ? [{ id: logoDraft.id, file: logoDraft.file }]
        : [];
      const hasUploads = pendingFiles.length > 0;
      const logoPayload = logoDraft
        ? logoDraft.file
          ? {
              id: logoDraft.id,
              path: "",
              alt: logoDraft.alt?.trim() || config.nomeLoja,
              pending: true as const,
            }
          : {
              id: logoDraft.id,
              path: logoDraft.path,
              alt: logoDraft.alt?.trim() || config.nomeLoja,
            }
        : null;

      await runMutation(
        {
          label: "Salvando configurações",
          determinate: hasUploads,
        },
        async ({ setProgress }) => {
          const payload = {
            versao: config.versao,
            nomeLoja: config.nomeLoja,
            mostrarNomeComLogo: Boolean(config.mostrarNomeComLogo),
            mostrarCarrinho: Boolean(config.mostrarCarrinho),
            assinatura: config.assinatura,
            slogan: config.slogan,
            layout: config.layout,
            cores: config.cores,
            logo: logoPayload,
            whatsapp: {
              ...config.whatsapp,
              telefone: normalizeWaDigits(config.whatsapp.telefone),
            },
            instagram: config.instagram,
            endereco: {
              ...config.endereco,
              mostrar: Boolean(config.endereco.mostrar),
            },
            telefones: {
              fixo: normalizeWaDigits(config.telefones.fixo),
              celular: normalizeWaDigits(config.telefones.celular),
              usarWhatsappComoCelular: Boolean(
                config.telefones.usarWhatsappComoCelular,
              ),
              mostrarFixo: Boolean(config.telefones.mostrarFixo),
              mostrarCelular: Boolean(config.telefones.mostrarCelular),
            },
            horarios: config.horarios,
            textos: config.textos,
            navegacao: config.navegacao ?? DEFAULT_NAVEGACAO,
            painel: {
              metaReceitaMensal: config.painel?.metaReceitaMensal ?? null,
            },
          };

          const res = await mutationFetch(
            "/api/v1/admin/site-config",
            {
              method: "PUT",
              body: hasUploads
                ? buildMutationFormData(payload, pendingFiles)
                : JSON.stringify(payload),
              headers: hasUploads
                ? undefined
                : { "Content-Type": "application/json" },
            },
            {
              onUploadProgress: hasUploads ? setProgress : undefined,
            },
          );
          const data = (await res.json()) as SiteConfig & {
            error?: { message?: string };
          };
          assertMutationOk(res, data, "Erro ao salvar");
          revokePreviewUrl(logoDraft?.previewUrl);
          const next = normalizeSiteConfig(data);
          const nextLogo = logoFromConfig(data);
          committedTheme.current = {
            cores: data.cores,
            layout: data.layout ?? "classic",
          };
          applySiteTheme(committedTheme.current);
          setConfig(next);
          setLogoDraft(nextLogo);
          setBaselineFp(configFingerprint(next, nextLogo));
          setBaselineLayout(data.layout ?? "classic");
          toastMutationSuccess("Configurações salvas.", {
            id: "save-site-config",
          });
        },
      );
    } catch (err) {
      toastMutationError(err, { id: "save-site-config" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__intro">
          <h1 className="admin-page__title">Configurações</h1>
          {isDirty ? (
            <p className="admin-config-dirty" role="status">
              Alterações não salvas
            </p>
          ) : null}
        </div>
        <AdminPageActions>
          <LoadingButton
            className="btn btn-primary btn-sm"
            type="submit"
            form={activeFormId}
            loading={saving}
            loadingLabel="Salvando…"
            disabled={!isDirty && !saving}
          >
            Salvar
          </LoadingButton>
        </AdminPageActions>
      </header>

      <div className="dash-tabs dash-tabs--config">
        <div
          className="dash-tabs__list"
          role="tablist"
          aria-label="Seções de configurações"
          onKeyDown={(e) => {
            const current = CONFIGURACOES_TABS.findIndex((t) => t.id === tab);
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              focusTab(current + 1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              focusTab(current - 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              focusTab(0);
            } else if (e.key === "End") {
              e.preventDefault();
              focusTab(CONFIGURACOES_TABS.length - 1);
            }
          }}
        >
          {CONFIGURACOES_TABS.map((t, i) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${tabsId}-tab-${t.id}`}
                aria-controls={`${tabsId}-panel-${t.id}`}
                aria-selected={selected}
                aria-label={t.label}
                tabIndex={selected ? 0 : -1}
                className={
                  selected
                    ? "dash-tabs__tab dash-tabs__tab--active"
                    : "dash-tabs__tab"
                }
                onClick={() => selectTab(t.id)}
              >
                {t.shortLabel ? (
                  <>
                    <span className="dash-tabs__label-full">{t.label}</span>
                    <span className="dash-tabs__label-short">{t.shortLabel}</span>
                  </>
                ) : (
                  t.label
                )}
              </button>
            );
          })}
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-identidade`}
          aria-labelledby={`${tabsId}-tab-identidade`}
          hidden={tab !== "identidade"}
        >
          <IdentidadePanel
            formId={identidadeFormId}
            config={config}
            logoDraft={logoDraft}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
            onLogoChange={onLogoChange}
          />
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-contato`}
          aria-labelledby={`${tabsId}-tab-contato`}
          hidden={tab !== "contato"}
        >
          <ContatoPanel
            formId={contatoFormId}
            config={config}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
          />
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-whatsapp`}
          aria-labelledby={`${tabsId}-tab-whatsapp`}
          hidden={tab !== "whatsapp"}
        >
          <WhatsAppPanel
            formId={whatsappFormId}
            config={config}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
            onOpenIdentidadeTab={() => selectTab("identidade")}
          />
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-vitrine`}
          aria-labelledby={`${tabsId}-tab-vitrine`}
          hidden={tab !== "vitrine"}
        >
          <VitrinePanel
            formId={vitrineFormId}
            config={config}
            baselineLayout={baselineLayout}
            primaryColor={colorPickerValue}
            initialBanners={initialBanners}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
          />
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-navegacao`}
          aria-labelledby={`${tabsId}-tab-navegacao`}
          hidden={tab !== "navegacao"}
        >
          <NavegacaoPanel
            formId={navegacaoFormId}
            config={config}
            initialCategories={initialCategories}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
          />
        </div>

        <div
          className="dash-tabs__panel"
          role="tabpanel"
          id={`${tabsId}-panel-painel`}
          aria-labelledby={`${tabsId}-tab-painel`}
          hidden={tab !== "painel"}
        >
          <PainelPanel
            formId={painelFormId}
            config={config}
            disabled={saving}
            onSubmit={save}
            onConfigChange={onConfigChange}
          />
        </div>
      </div>
    </div>
  );
}
