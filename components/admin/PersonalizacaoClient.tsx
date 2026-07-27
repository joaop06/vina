"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
import {
  listDirtyTabs,
  logoFromConfig,
  normalizeSiteConfig,
  tabBaselineFingerprints,
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
import type { SiteConfig } from "@/src/schemas/site-config";
import {
  extractTabSlice,
  mergeTabIntoConfig,
  type SiteConfigTabApiResponse,
  type SiteConfigTabId,
} from "@/src/schemas/site-config-tabs";

const IdentidadePanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/IdentidadePanel").then(
      (m) => m.IdentidadePanel,
    ),
  { ssr: false },
);
const ContatoPanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/ContatoPanel").then(
      (m) => m.ContatoPanel,
    ),
  { ssr: false },
);
const WhatsAppPanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/WhatsAppPanel").then(
      (m) => m.WhatsAppPanel,
    ),
  { ssr: false },
);
const VitrinePanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/VitrinePanel").then(
      (m) => m.VitrinePanel,
    ),
  { ssr: false },
);
const NavegacaoPanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/NavegacaoPanel").then(
      (m) => m.NavegacaoPanel,
    ),
  { ssr: false },
);
const TextosVitrinePanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/TextosVitrinePanel").then(
      (m) => m.TextosVitrinePanel,
    ),
  { ssr: false },
);
const TemaAvancadoPanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/TemaAvancadoPanel").then(
      (m) => m.TemaAvancadoPanel,
    ),
  { ssr: false },
);
const PainelPanel = dynamic(
  () =>
    import("@/components/admin/configuracoes/PainelPanel").then(
      (m) => m.PainelPanel,
    ),
  { ssr: false },
);

function isLeavingConfiguracoes(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return true;
    return !url.pathname.startsWith("/admin/personalizacao");
  } catch {
    return true;
  }
}

function tabPayload(
  config: SiteConfig,
  tab: SiteConfigTabId,
  logoDraft: ImageMeta | null,
): unknown {
  const slice = extractTabSlice(config, tab);
  if (tab === "identidade") {
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
    return {
      nomeLoja: config.nomeLoja,
      mostrarNomeComLogo: Boolean(config.mostrarNomeComLogo),
      mostrarCarrinho: Boolean(config.mostrarCarrinho),
      assinatura: config.assinatura,
      slogan: config.slogan,
      cores: config.cores,
      logo: logoPayload,
    };
  }
  if (tab === "whatsapp") {
    return {
      whatsapp: {
        ...config.whatsapp,
        telefone: normalizeWaDigits(config.whatsapp.telefone),
      },
      comportamento: config.comportamento,
    };
  }
  if (tab === "contato") {
    return {
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
      textos: {
        sobre: config.textos.sobre,
        trocas: config.textos.trocas,
      },
    };
  }
  return slice;
}

export function PersonalizacaoClient({
  initialConfig,
  initialBanners,
  initialCategories,
  initialTab,
  initialLoadedTabs,
}: {
  initialConfig: SiteConfig;
  initialBanners: Banner[];
  initialCategories: Category[];
  initialTab?: string;
  initialLoadedTabs: ConfiguracoesTabId[];
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
  const textosFormId = useId();
  const temaFormId = useId();
  const painelFormId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const allowLeaveRef = useRef(false);

  const [config, setConfig] = useState<SiteConfig>(() =>
    normalizeSiteConfig(initialConfig),
  );
  const [logoDraft, setLogoDraft] = useState<ImageMeta | null>(() =>
    logoFromConfig(initialConfig),
  );
  const [loadedTabs, setLoadedTabs] = useState<Set<ConfiguracoesTabId>>(
    () => new Set(initialLoadedTabs),
  );
  const loadedTabsRef = useRef(loadedTabs);
  loadedTabsRef.current = loadedTabs;
  const [loadingTab, setLoadingTab] = useState<ConfiguracoesTabId | null>(null);
  const [baselineByTab, setBaselineByTab] = useState(() =>
    tabBaselineFingerprints(
      normalizeSiteConfig(initialConfig),
      logoFromConfig(initialConfig),
      initialLoadedTabs,
    ),
  );
  const [baselineLayout, setBaselineLayout] = useState(
    () => initialConfig.layout ?? "classic",
  );
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [bannersLoaded, setBannersLoaded] = useState(
    () => initialBanners.length > 0 || initialLoadedTabs.includes("vitrine"),
  );
  const [categoriesLoaded, setCategoriesLoaded] = useState(
    () =>
      initialCategories.length > 0 ||
      initialLoadedTabs.includes("vitrine") ||
      initialLoadedTabs.includes("navegacao"),
  );
  const [saving, setSaving] = useState(false);
  const { runMutation } = useAdminBusy();
  const committedTheme = useRef<Pick<SiteConfig, "cores" | "layout">>({
    cores: initialConfig.cores,
    layout: initialConfig.layout ?? "classic",
  });

  const colorPickerValue = normalizeHexForPicker(config.cores.primaria);
  const selectedLayout = config.layout ?? "classic";
  const dirtyTabs = listDirtyTabs(config, logoDraft, baselineByTab, loadedTabs);
  const isDirty = dirtyTabs.length > 0;

  const activeFormId =
    tab === "contato"
      ? contatoFormId
      : tab === "whatsapp"
        ? whatsappFormId
        : tab === "vitrine"
          ? vitrineFormId
          : tab === "navegacao"
            ? navegacaoFormId
            : tab === "textos"
              ? textosFormId
              : tab === "tema"
                ? temaFormId
                : tab === "painel"
                  ? painelFormId
                  : identidadeFormId;

  const ensureTabLoaded = useCallback(
    async (next: ConfiguracoesTabId) => {
      if (loadedTabsRef.current.has(next)) return;

      setLoadingTab(next);
      try {
        const res = await fetch(`/api/v1/admin/site-config?tab=${next}`);
        const data = (await res.json()) as SiteConfigTabApiResponse & {
          error?: { message?: string };
        };
        if (!res.ok) {
          throw new Error(data.error?.message ?? "Erro ao carregar aba");
        }

        setConfig((prev) => {
          const merged = normalizeSiteConfig(
            mergeTabIntoConfig(prev, next, data.data, {
              versao: data.versao,
              atualizadoEm: data.atualizadoEm,
            }),
          );
          const logo =
            next === "identidade" ? logoFromConfig(merged) : logoDraft;
          if (next === "identidade") {
            setLogoDraft(logoFromConfig(merged));
          }
          setBaselineByTab((baseline) => ({
            ...baseline,
            ...tabBaselineFingerprints(merged, logo, [next]),
          }));
          return merged;
        });
        setLoadedTabs((prev) => {
          const nextSet = new Set(prev).add(next);
          loadedTabsRef.current = nextSet;
          return nextSet;
        });

        if (next === "vitrine" && !bannersLoaded) {
          const bRes = await fetch("/api/v1/admin/banners");
          const bData = (await bRes.json()) as { items?: Banner[] };
          setBanners(bData.items ?? []);
          setBannersLoaded(true);
        }
        if (
          (next === "vitrine" || next === "navegacao") &&
          !categoriesLoaded
        ) {
          const cRes = await fetch("/api/v1/admin/categories");
          const cData = (await cRes.json()) as { items?: Category[] };
          setCategories(cData.items ?? []);
          setCategoriesLoaded(true);
        }
        if (next === "vitrine") {
          const vitrineData = data.data as { layout?: SiteConfig["layout"] };
          setBaselineLayout(vitrineData.layout ?? "classic");
        }
      } finally {
        setLoadingTab(null);
      }
    },
    [bannersLoaded, categoriesLoaded, logoDraft],
  );

  function selectTab(next: ConfiguracoesTabId) {
    setTab(next);
    router.replace(configTabHref(next), { scroll: false });
    void ensureTabLoaded(next).catch((err) => {
      toastMutationError(err, { id: "load-config-tab" });
    });
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
    if (!loadedTabs.has("identidade") && !loadedTabs.has("vitrine")) return;
    applySiteTheme({
      cores: { ...config.cores, primaria: colorPickerValue },
      layout: selectedLayout,
    });
  }, [colorPickerValue, config.cores, loadedTabs, selectedLayout]);

  useEffect(() => {
    return () => {
      applySiteTheme(committedTheme.current);
    };
  }, []);

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
    const tabsToSave = listDirtyTabs(
      config,
      logoDraft,
      baselineByTab,
      loadedTabs,
    );
    if (tabsToSave.length === 0) return;

    setSaving(true);
    try {
      const pendingFiles = logoDraft?.file
        ? [{ id: logoDraft.id, file: logoDraft.file }]
        : [];
      const hasUploads =
        tabsToSave.includes("identidade") && pendingFiles.length > 0;

      await runMutation(
        {
          label: "Salvando configurações",
          determinate: hasUploads,
        },
        async ({ setProgress }) => {
          const tabsPayload: Record<string, unknown> = {};
          for (const t of tabsToSave) {
            tabsPayload[t] = tabPayload(config, t, logoDraft);
          }
          const payload = {
            versao: config.versao,
            tabs: tabsPayload,
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
          setBaselineByTab(
            tabBaselineFingerprints(next, nextLogo, loadedTabs),
          );
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

  const tabReady = loadedTabs.has(tab) && loadingTab !== tab;

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

        {!tabReady ? (
          <div className="dash-tabs__panel" role="status">
            <p className="muted">Carregando…</p>
          </div>
        ) : (
          <>
            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-identidade`}
              aria-labelledby={`${tabsId}-tab-identidade`}
              hidden={tab !== "identidade"}
            >
              {tab === "identidade" ? (
                <IdentidadePanel
                  formId={identidadeFormId}
                  config={config}
                  logoDraft={logoDraft}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                  onLogoChange={onLogoChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-contato`}
              aria-labelledby={`${tabsId}-tab-contato`}
              hidden={tab !== "contato"}
            >
              {tab === "contato" ? (
                <ContatoPanel
                  formId={contatoFormId}
                  config={config}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-whatsapp`}
              aria-labelledby={`${tabsId}-tab-whatsapp`}
              hidden={tab !== "whatsapp"}
            >
              {tab === "whatsapp" ? (
                <WhatsAppPanel
                  formId={whatsappFormId}
                  config={config}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                  onOpenIdentidadeTab={() => selectTab("identidade")}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-vitrine`}
              aria-labelledby={`${tabsId}-tab-vitrine`}
              hidden={tab !== "vitrine"}
            >
              {tab === "vitrine" ? (
                <VitrinePanel
                  formId={vitrineFormId}
                  config={config}
                  baselineLayout={baselineLayout}
                  primaryColor={colorPickerValue}
                  initialBanners={banners}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-navegacao`}
              aria-labelledby={`${tabsId}-tab-navegacao`}
              hidden={tab !== "navegacao"}
            >
              {tab === "navegacao" ? (
                <NavegacaoPanel
                  formId={navegacaoFormId}
                  config={config}
                  initialCategories={categories}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-textos`}
              aria-labelledby={`${tabsId}-tab-textos`}
              hidden={tab !== "textos"}
            >
              {tab === "textos" ? (
                <TextosVitrinePanel
                  formId={textosFormId}
                  config={config}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-tema`}
              aria-labelledby={`${tabsId}-tab-tema`}
              hidden={tab !== "tema"}
            >
              {tab === "tema" ? (
                <TemaAvancadoPanel
                  formId={temaFormId}
                  config={config}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>

            <div
              className="dash-tabs__panel"
              role="tabpanel"
              id={`${tabsId}-panel-painel`}
              aria-labelledby={`${tabsId}-tab-painel`}
              hidden={tab !== "painel"}
            >
              {tab === "painel" ? (
                <PainelPanel
                  formId={painelFormId}
                  config={config}
                  disabled={saving}
                  onSubmit={save}
                  onConfigChange={onConfigChange}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
