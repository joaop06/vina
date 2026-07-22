"use client";

import { useMemo, useRef, useState } from "react";
import { useAdminBusy } from "@/components/admin/AdminBusy";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { ImageField, type ImageMeta } from "@/components/admin/ImageField";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { mutationFetch, assertMutationOk } from "@/components/admin/mutationFetch";
import {
  toastMutationError,
  toastMutationWarning,
} from "@/components/admin/adminToast";
import {
  UPLOAD_SOFT_LIMIT_BYTES,
  buildMutationFormData,
  createLocalImageDraft,
  revokePreviewUrl,
  validateImageFile,
} from "@/components/admin/uploadClient";
import {
  getBannerSlotsForLayout,
  type LayoutBannerSlot,
} from "@/components/public/layouts/banner-slots";
import { mediaUrl } from "@/src/lib/front/format";
import type { Banner, BannerPosicao } from "@/src/schemas/banner";
import type { SiteLayoutId } from "@/src/schemas/site-config";

type SlotDraft = {
  ativo: boolean;
  imagem: ImageMeta | null;
};

function imageFromBanner(b: Banner): ImageMeta {
  return {
    id: b.imagem.id,
    path: b.imagem.path,
    alt: b.imagem.alt,
  };
}

function pickPrimary(banners: Banner[]): Banner | null {
  return (
    [...banners].sort((a, b) => {
      if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
      return a.ordem - b.ordem;
    })[0] ?? null
  );
}

function sortByOrdem(banners: Banner[]): Banner[] {
  return [...banners].sort((a, b) => a.ordem - b.ordem);
}

export function BannersClient({
  initialItems,
  layout,
  embedded = false,
}: {
  initialItems: Banner[];
  layout: SiteLayoutId;
  /** Omit page header when nested inside Configurações tabs. */
  embedded?: boolean;
}) {
  const { confirm } = useConfirm();
  const { runMutation } = useAdminBusy();
  const [items, setItems] = useState<Banner[]>(initialItems);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Partial<Record<BannerPosicao, SlotDraft>>
  >({});
  const slots = useMemo(() => getBannerSlotsForLayout(layout), [layout]);

  const byPosicao = useMemo(() => {
    const map = {} as Partial<Record<BannerPosicao, Banner[]>>;
    for (const slot of slots) map[slot.posicao] = [];
    for (const b of items) {
      if (map[b.posicao]) map[b.posicao]!.push(b);
    }
    return map;
  }, [items, slots]);

  async function load() {
    const res = await fetch("/api/v1/admin/banners");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  function clearDraft(posicao: BannerPosicao) {
    setDrafts((prev) => {
      const next = { ...prev };
      const draft = next[posicao];
      if (draft?.imagem?.previewUrl) revokePreviewUrl(draft.imagem.previewUrl);
      delete next[posicao];
      return next;
    });
  }

  function slotState(posicao: BannerPosicao) {
    const group = byPosicao[posicao] ?? [];
    const primary = pickPrimary(group);
    const extras = primary
      ? group.filter((b) => b.id !== primary.id)
      : group;
    const draft = drafts[posicao];
    const ativo = draft?.ativo ?? primary?.ativo ?? true;
    const imagem =
      draft?.imagem !== undefined
        ? draft.imagem
        : primary
          ? imageFromBanner(primary)
          : null;
    return { primary, extras, ativo, imagem };
  }

  function updateDraft(
    posicao: BannerPosicao,
    patch: Partial<SlotDraft>,
    baseline?: SlotDraft,
  ) {
    setDrafts((prev) => {
      const current =
        prev[posicao] ??
        baseline ?? {
          ativo: true,
          imagem: null,
        };
      return {
        ...prev,
        [posicao]: { ...current, ...patch },
      };
    });
  }

  async function saveBanner(opts: {
    key: string;
    label: string;
    existing?: Banner | null;
    posicao: BannerPosicao;
    ativo: boolean;
    imagem: ImageMeta;
  }) {
    const { key, label, existing, posicao, ativo, imagem } = opts;
    const slotLabel =
      slots.find((s) => s.posicao === posicao)?.label ?? posicao;

    const imagemPayload = imagem.file
      ? {
        id: imagem.id,
        path: "",
        alt: slotLabel,
        pending: true as const,
      }
      : {
        id: imagem.id,
        path: imagem.path,
        alt: slotLabel,
      };

    const pendingFiles = imagem.file
      ? [{ id: imagem.id, file: imagem.file }]
      : [];
    const hasUploads = pendingFiles.length > 0;

    setBusyKey(key);
    try {
      await runMutation(
        { label, determinate: hasUploads },
        async ({ setProgress }) => {
          const payload = existing
            ? {
              versao: existing.versao,
              ativo,
              imagem: imagemPayload,
            }
            : {
              posicao,
              ativo,
              imagem: imagemPayload,
            };

          const res = await mutationFetch(
            existing
              ? `/api/v1/admin/banners/${existing.id}`
              : "/api/v1/admin/banners",
            {
              method: existing ? "PATCH" : "POST",
              body: buildMutationFormData(payload, pendingFiles),
            },
            {
              onUploadProgress: hasUploads ? setProgress : undefined,
            },
          );
          const data = await res.json();
          assertMutationOk(res, data, "Erro ao salvar banner");
          clearDraft(posicao);
          await load();
        },
      );
    } catch (err) {
      toastMutationError(err, { id: "banner-save" });
    } finally {
      setBusyKey(null);
    }
  }

  async function patchBanner(
    banner: Banner,
    body: Record<string, unknown>,
    key: string,
    label: string,
  ) {
    setBusyKey(key);
    try {
      await runMutation({ label }, async () => {
        const res = await mutationFetch(`/api/v1/admin/banners/${banner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versao: banner.versao, ...body }),
        });
        const data = await res.json();
        assertMutationOk(res, data, label);
        await load();
      });
    } catch (err) {
      toastMutationError(err, { id: "banner-patch" });
      throw err;
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleAtivo(posicao: BannerPosicao) {
    const { primary, ativo, imagem } = slotState(posicao);
    const next = !ativo;

    if (!primary) {
      updateDraft(posicao, { ativo: next, imagem }, { ativo, imagem });
      return;
    }

    if (drafts[posicao]?.imagem?.file) {
      updateDraft(posicao, { ativo: next });
      return;
    }

    try {
      await patchBanner(
        primary,
        { ativo: next },
        `${posicao}:toggle`,
        "Atualizando status",
      );
      clearDraft(posicao);
    } catch {
      /* error already surfaced */
    }
  }

  async function postBannerCreate(
    posicao: BannerPosicao,
    imagem: ImageMeta,
    setProgress?: (value: number) => void,
  ) {
    const slotLabel =
      slots.find((s) => s.posicao === posicao)?.label ?? posicao;
    const imagemPayload = {
      id: imagem.id,
      path: "",
      alt: slotLabel,
      pending: true as const,
    };
    const pendingFiles = imagem.file
      ? [{ id: imagem.id, file: imagem.file }]
      : [];
    const hasUploads = pendingFiles.length > 0;

    const res = await mutationFetch(
      "/api/v1/admin/banners",
      {
        method: "POST",
        body: buildMutationFormData(
          { posicao, ativo: true, imagem: imagemPayload },
          pendingFiles,
        ),
      },
      {
        onUploadProgress: hasUploads ? setProgress : undefined,
      },
    );
    const data = await res.json();
    assertMutationOk(res, data, "Erro ao criar banner");
  }

  async function addSlides(posicao: BannerPosicao, images: ImageMeta[]) {
    if (!images.length) return;
    const slot = slots.find((s) => s.posicao === posicao);
    const remaining =
      (slot?.maxItems ?? images.length) -
      (byPosicao[posicao] ?? []).length;
    const batch = images.slice(0, Math.max(0, remaining));
    if (!batch.length) {
      toastMutationWarning(`Limite de ${slot?.maxItems ?? 0} slides atingido.`, {
        id: "banner-limit",
      });
      return;
    }

    setBusyKey(`${posicao}:save`);
    try {
      await runMutation(
        {
          label:
            batch.length === 1
              ? `Criando ${slot?.label ?? "slide"}`
              : `Adicionando ${batch.length} slides`,
          determinate: true,
        },
        async ({ setProgress }) => {
          for (let i = 0; i < batch.length; i++) {
            const base = (i / batch.length) * 100;
            const span = 100 / batch.length;
            await postBannerCreate(posicao, batch[i]!, (p) => {
              setProgress(base + (p / 100) * span);
            });
            setProgress(((i + 1) / batch.length) * 100);
          }
          await load();
        },
      );
    } catch (err) {
      toastMutationError(err, { id: "banner-add-slides" });
      await load().catch(() => undefined);
    } finally {
      for (const img of images) revokePreviewUrl(img.previewUrl);
      setBusyKey(null);
    }
  }

  async function reorderSlides(posicao: BannerPosicao, orderedIds: string[]) {
    const group = sortByOrdem(byPosicao[posicao] ?? []);
    const currentIds = group.map((b) => b.id);
    if (
      orderedIds.length !== currentIds.length ||
      orderedIds.every((id, i) => id === currentIds[i])
    ) {
      return;
    }

    const byId = new Map(group.map((b) => [b.id, b]));
    for (const id of orderedIds) {
      if (!byId.has(id)) return;
    }

    setBusyKey(`${posicao}:move`);
    try {
      await runMutation({ label: "Reordenando" }, async () => {
        const working = new Map(
          group.map((b) => [b.id, { versao: b.versao, ordem: b.ordem }]),
        );

        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i]!;
          const current = working.get(id)!;
          if (current.ordem === i) continue;

          const res = await mutationFetch(`/api/v1/admin/banners/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ versao: current.versao, ordem: i }),
          });
          const data = await res.json();
          assertMutationOk(res, data, "Erro ao reordenar");
          const updated = data as Banner;
          working.set(id, { versao: updated.versao, ordem: updated.ordem });
        }
        await load();
      });
    } catch (err) {
      toastMutationError(err, { id: "banner-reorder" });
      await load().catch(() => undefined);
    } finally {
      setBusyKey(null);
    }
  }

  function moveSlide(posicao: BannerPosicao, bannerId: string, direction: -1 | 1) {
    const group = sortByOrdem(byPosicao[posicao] ?? []);
    const idx = group.findIndex((b) => b.id === bannerId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= group.length) return;
    const ordered = group.map((b) => b.id);
    const [id] = ordered.splice(idx, 1);
    ordered.splice(target, 0, id!);
    void reorderSlides(posicao, ordered);
  }

  async function removeBanner(id: string, posicao: BannerPosicao) {
    const ok = await confirm({
      title: "Excluir banner?",
      description: "A imagem associada também será removida.",
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    setBusyKey(`${id}:delete`);
    try {
      await runMutation({ label: "Excluindo banner" }, async () => {
        const res = await mutationFetch(`/api/v1/admin/banners/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        assertMutationOk(res, data, "Erro ao excluir");
        clearDraft(posicao);
        await load();
      });
    } catch (err) {
      toastMutationError(err, { id: "banner-delete" });
    } finally {
      setBusyKey(null);
    }
  }

  const anyBusy = busyKey !== null;
  const multiColumn = slots.length > 1;

  const body = (
    <>
      {!embedded ? (
        <header className="admin-page__header">
          <div className="admin-page__intro">
            <p className="admin-page__eyebrow">Vitrine</p>
            <h1 className="admin-page__title">Banners</h1>
            <p className="admin-page__desc">
              Áreas disponíveis conforme o layout selecionado em Configurações.
              Ao escolher a imagem, o banner é criado ou atualizado
              automaticamente.
            </p>
          </div>
        </header>
      ) : null}

      <div
        className={
          multiColumn
            ? "admin-banner-slots"
            : "admin-banner-slots admin-banner-slots--single"
        }
      >
        {slots.map((slot) =>
          slot.maxItems > 1 ? (
            <MultiBannerSlot
              key={slot.posicao}
              slot={slot}
              items={sortByOrdem(byPosicao[slot.posicao] ?? [])}
              anyBusy={anyBusy}
              busyKey={busyKey}
              onAdd={(images) => void addSlides(slot.posicao, images)}
              onReplace={(banner, imagem) => {
                void saveBanner({
                  key: `${banner.id}:save`,
                  label: "Atualizando slide",
                  existing: banner,
                  posicao: slot.posicao,
                  ativo: banner.ativo,
                  imagem,
                }).finally(() => revokePreviewUrl(imagem.previewUrl));
              }}
              onToggle={(banner) =>
                void patchBanner(
                  banner,
                  { ativo: !banner.ativo },
                  `${banner.id}:toggle`,
                  "Atualizando status",
                ).catch(() => undefined)
              }
              onReorder={(orderedIds) =>
                void reorderSlides(slot.posicao, orderedIds)
              }
              onMove={(bannerId, dir) =>
                moveSlide(slot.posicao, bannerId, dir)
              }
              onRemove={(id) => void removeBanner(id, slot.posicao)}
            />
          ) : (
            <SingleBannerSlot
              key={slot.posicao}
              slot={slot}
              state={slotState(slot.posicao)}
              draft={drafts[slot.posicao]}
              anyBusy={anyBusy}
              busyKey={busyKey}
              onUpdateDraft={updateDraft}
              onCommit={(imagem, ativo) => {
                const { primary } = slotState(slot.posicao);
                void saveBanner({
                  key: `${slot.posicao}:save`,
                  label: primary
                    ? `Atualizando ${slot.label}`
                    : `Criando ${slot.label}`,
                  existing: primary,
                  posicao: slot.posicao,
                  ativo,
                  imagem,
                });
              }}
              onToggle={() => void toggleAtivo(slot.posicao)}
              onRemove={(id) => void removeBanner(id, slot.posicao)}
            />
          ),
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="admin-banners-embed">{body}</div>;
  }

  return <div className="admin-page">{body}</div>;
}

function SingleBannerSlot({
  slot,
  state,
  draft,
  anyBusy,
  busyKey,
  onUpdateDraft,
  onCommit,
  onToggle,
  onRemove,
}: {
  slot: LayoutBannerSlot;
  state: {
    primary: Banner | null;
    extras: Banner[];
    ativo: boolean;
    imagem: ImageMeta | null;
  };
  draft?: SlotDraft;
  anyBusy: boolean;
  busyKey: string | null;
  onUpdateDraft: (
    posicao: BannerPosicao,
    patch: Partial<SlotDraft>,
    baseline?: SlotDraft,
  ) => void;
  onCommit: (imagem: ImageMeta, ativo: boolean) => void;
  onToggle: () => void;
  onRemove: (id: string) => void;
}) {
  const { primary, extras, ativo, imagem } = state;
  const saving = busyKey === `${slot.posicao}:save`;
  const pendingFile = Boolean(draft?.imagem?.file);

  return (
    <section
      className="admin-panel admin-banner-slot"
      aria-label={slot.label}
    >
      <div className="admin-panel__head">
        <h2>{slot.label}</h2>
      </div>
      <div className="admin-panel__body">
        <p className="admin-banner-slot__hint">{slot.hint}</p>

        <ImageField
          dominio="banners"
          value={imagem}
          showAlt={false}
          showRemove={!primary}
          required={!primary}
          disabled={anyBusy}
          onChange={(next) => {
            const baseline = {
              ativo,
              imagem: primary ? imageFromBanner(primary) : null,
            };
            if (next === null) {
              onUpdateDraft(slot.posicao, { imagem: null }, baseline);
              return;
            }
            onUpdateDraft(slot.posicao, { imagem: next, ativo }, baseline);
            onCommit(next, ativo);
          }}
        />

        {saving ? (
          <p className="admin-banner-slot__hint" aria-live="polite">
            Salvando imagem e definição do banner…
          </p>
        ) : null}

        <label className="admin-banner-slot__status">
          <span>Status</span>
          <select
            className="select"
            value={ativo ? "ativo" : "inativo"}
            disabled={anyBusy}
            onChange={onToggle}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>

        {pendingFile && imagem?.file && !saving ? (
          <div className="admin-banner-slot__actions">
            <LoadingButton
              type="button"
              className="btn btn-primary"
              loading={false}
              disabled={anyBusy}
              onClick={() => onCommit(imagem, ativo)}
            >
              Tentar novamente
            </LoadingButton>
          </div>
        ) : null}

        {primary ? (
          <div className="admin-banner-slot__actions">
            <LoadingButton
              type="button"
              className="btn btn-sm btn-ghost-danger"
              loading={busyKey === `${primary.id}:delete`}
              loadingLabel="Excluindo…"
              disabled={anyBusy}
              onClick={() => onRemove(primary.id)}
            >
              Excluir
            </LoadingButton>
          </div>
        ) : null}

        {extras.length > 0 ? (
          <div className="admin-banner-slot__extras">
            <p className="admin-alert">
              Há {extras.length}{" "}
              {extras.length === 1 ? "banner extra" : "banners extras"} nesta
              área. Exclua os duplicados.
            </p>
            <ul className="admin-banner-slot__extra-list">
              {extras.map((extra) => (
                <li key={extra.id}>
                  <span>
                    {extra.ativo ? "Ativo" : "Inativo"} · v{extra.versao}
                  </span>
                  <LoadingButton
                    type="button"
                    className="btn-quiet btn-quiet--danger"
                    loading={busyKey === `${extra.id}:delete`}
                    loadingLabel="Excluindo…"
                    disabled={anyBusy}
                    onClick={() => onRemove(extra.id)}
                  >
                    Excluir
                  </LoadingButton>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MultiBannerSlot({
  slot,
  items,
  anyBusy,
  busyKey,
  onAdd,
  onReplace,
  onToggle,
  onReorder,
  onMove,
  onRemove,
}: {
  slot: LayoutBannerSlot;
  items: Banner[];
  anyBusy: boolean;
  busyKey: string | null;
  onAdd: (images: ImageMeta[]) => void;
  onReplace: (banner: Banner, imagem: ImageMeta) => void;
  onToggle: (banner: Banner) => void;
  onReorder: (orderedIds: string[]) => void;
  onMove: (bannerId: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<Banner | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const remaining = slot.maxItems - items.length;
  const canAdd = !anyBusy && remaining > 0;
  const saving = busyKey === `${slot.posicao}:save`;
  const moving = busyKey === `${slot.posicao}:move`;

  function filesToDrafts(fileList: FileList | null): ImageMeta[] {
    if (!fileList?.length) return [];
    setStatus(null);
    const files = Array.from(fileList).slice(0, remaining);
    if (!files.length) {
      toastMutationWarning(`Limite de ${slot.maxItems} slides atingido.`, {
        id: "banner-slot-limit",
      });
      return [];
    }

    const drafts: ImageMeta[] = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation) {
        toastMutationWarning(validation, { id: "banner-file-validation" });
        continue;
      }
      if (file.size > UPLOAD_SOFT_LIMIT_BYTES) {
        setStatus("Arquivo acima de 5 MB — o envio pode demorar.");
      }
      try {
        const draft = createLocalImageDraft(file);
        drafts.push({
          id: draft.id,
          path: "",
          alt: slot.label,
          file: draft.file,
          previewUrl: draft.previewUrl,
          pending: true,
        });
      } catch (err) {
        toastMutationWarning(
          err instanceof Error ? err.message : "Arquivo inválido",
          { id: "banner-file-validation" },
        );
      }
    }
    return drafts;
  }

  function handleAddFiles(fileList: FileList | null) {
    const drafts = filesToDrafts(fileList);
    if (addInputRef.current) addInputRef.current.value = "";
    if (drafts.length) onAdd(drafts);
  }

  function openAddPicker() {
    if (!canAdd) return;
    addInputRef.current?.click();
  }

  function openReplacePicker(banner: Banner) {
    if (anyBusy) return;
    replaceTargetRef.current = banner;
    replaceInputRef.current?.click();
  }

  function handleReplaceFile(fileList: FileList | null) {
    const banner = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!banner || !fileList?.[0]) return;

    const file = fileList[0];
    const validation = validateImageFile(file);
    if (validation) {
      toastMutationWarning(validation, { id: "banner-file-validation" });
      return;
    }
    try {
      const draft = createLocalImageDraft(file);
      onReplace(banner, {
        id: draft.id,
        path: "",
        alt: slot.label,
        file: draft.file,
        previewUrl: draft.previewUrl,
        pending: true,
      });
    } catch (err) {
      toastMutationWarning(
        err instanceof Error ? err.message : "Arquivo inválido",
        { id: "banner-file-validation" },
      );
    }
  }

  function reorderById(fromId: string, toId: string) {
    if (fromId === toId || anyBusy) return;
    const from = items.findIndex((b) => b.id === fromId);
    const to = items.findIndex((b) => b.id === toId);
    if (from < 0 || to < 0) return;
    const next = items.map((b) => b.id);
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id!);
    onReorder(next);
  }

  function onDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!canAdd) return;
    handleAddFiles(e.dataTransfer.files);
  }

  const dropzoneHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      if (canAdd && e.dataTransfer.types.includes("Files")) setDragOver(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (canAdd && e.dataTransfer.types.includes("Files")) setDragOver(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOver(false);
      }
    },
    onDrop: onDropFiles,
  };

  return (
    <section
      className="admin-panel admin-banner-slot admin-banner-slot--multi"
      aria-label={slot.label}
    >
      <div className="admin-panel__head">
        <h2>{slot.label}</h2>
        <span className="tag-chip tag-chip--soft">
          {items.length}/{slot.maxItems}
        </span>
      </div>
      <div className="admin-panel__body">
        <p className="admin-banner-slot__hint">{slot.hint}</p>

        <input
          ref={addInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          hidden
          disabled={!canAdd}
          onChange={(e) => handleAddFiles(e.target.files)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          disabled={anyBusy}
          onChange={(e) => handleReplaceFile(e.target.files)}
        />

        {items.length === 0 ? (
          <button
            type="button"
            className={`admin-banner-carousel__dropzone${dragOver ? " is-dragover" : ""}${saving ? " is-busy" : ""}`}
            disabled={!canAdd}
            onClick={openAddPicker}
            {...dropzoneHandlers}
          >
            <span className="admin-banner-carousel__dropzone-icon" aria-hidden>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V8m0 0-3 3m3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="admin-banner-carousel__dropzone-title">
              {dragOver
                ? "Solte as imagens aqui"
                : "Clique ou arraste as imagens aqui"}
            </span>
            <span className="admin-banner-carousel__dropzone-hint">
              JPEG ou PNG · várias de uma vez · até {slot.maxItems} slides ·
              ideal 1920 × 1080
            </span>
          </button>
        ) : (
          <>
            <p className="admin-banner-carousel__howto">
              Arraste para reordenar · setas no celular · a ordem é a do
              carrossel
            </p>
            <ul className="admin-banner-carousel__grid">
              {items.map((banner, index) => {
                const preview = mediaUrl(banner.imagem.path);
                const isDragging = draggingId === banner.id;
                const isDropTarget =
                  dropTargetId === banner.id && draggingId !== banner.id;
                const itemBusy =
                  busyKey === `${banner.id}:save` ||
                  busyKey === `${banner.id}:delete` ||
                  busyKey === `${banner.id}:toggle`;

                return (
                  <li
                    key={banner.id}
                    className={[
                      "admin-banner-carousel__item",
                      !banner.ativo ? "is-inactive" : "",
                      isDragging ? "is-dragging" : "",
                      isDropTarget ? "is-drop-target" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (draggingId && draggingId !== banner.id) {
                        setDropTargetId(banner.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dropTargetId === banner.id) setDropTargetId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromId =
                        e.dataTransfer.getData("text/plain") || draggingId;
                      if (fromId) reorderById(fromId, banner.id);
                      setDraggingId(null);
                      setDropTargetId(null);
                    }}
                  >
                    <div
                      className="admin-banner-carousel__thumb"
                      draggable={!anyBusy}
                      onDragStart={(e) => {
                        setDraggingId(banner.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", banner.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                      }}
                      title="Arraste para mudar a ordem"
                    >
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt={banner.imagem.alt || `${slot.label} ${index + 1}`}
                          draggable={false}
                        />
                      ) : null}

                      <span className="admin-banner-carousel__badge">
                        Slide {index + 1}
                      </span>
                      {!banner.ativo ? (
                        <span className="admin-banner-carousel__badge admin-banner-carousel__badge--inactive">
                          Inativo
                        </span>
                      ) : null}

                      <span className="admin-banner-carousel__grip" aria-hidden>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <circle cx="5" cy="4" r="1.3" />
                          <circle cx="11" cy="4" r="1.3" />
                          <circle cx="5" cy="8" r="1.3" />
                          <circle cx="11" cy="8" r="1.3" />
                          <circle cx="5" cy="12" r="1.3" />
                          <circle cx="11" cy="12" r="1.3" />
                        </svg>
                      </span>

                      <button
                        type="button"
                        className="admin-banner-carousel__delete"
                        disabled={anyBusy}
                        onClick={() => onRemove(banner.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        aria-label={`Excluir slide ${index + 1}`}
                        title="Excluir"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M6 7h12M10 7V5h4v2m-6 0 1 12h6l1-12"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="admin-banner-carousel__item-body">
                      <div className="admin-banner-carousel__order">
                        <button
                          type="button"
                          className="admin-banner-carousel__order-btn"
                          disabled={anyBusy || index === 0}
                          onClick={() => onMove(banner.id, -1)}
                          aria-label="Mover para a esquerda"
                        >
                          ←
                        </button>
                        <span className="admin-banner-carousel__order-label">
                          {index + 1}º
                        </span>
                        <button
                          type="button"
                          className="admin-banner-carousel__order-btn"
                          disabled={anyBusy || index === items.length - 1}
                          onClick={() => onMove(banner.id, 1)}
                          aria-label="Mover para a direita"
                        >
                          →
                        </button>
                      </div>

                      <div className="admin-banner-carousel__actions">
                        <button
                          type="button"
                          className="admin-banner-carousel__action"
                          disabled={anyBusy}
                          onClick={() => onToggle(banner)}
                        >
                          {banner.ativo ? "Inativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className="admin-banner-carousel__action"
                          disabled={anyBusy}
                          onClick={() => openReplacePicker(banner)}
                        >
                          Trocar
                        </button>
                      </div>

                      {itemBusy ? (
                        <p
                          className="admin-banner-carousel__item-status"
                          aria-live="polite"
                        >
                          Atualizando…
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}

              {remaining > 0 ? (
                <li className="admin-banner-carousel__add-wrap">
                  <button
                    type="button"
                    className={`admin-banner-carousel__add${dragOver ? " is-dragover" : ""}`}
                    disabled={!canAdd}
                    onClick={openAddPicker}
                    {...dropzoneHandlers}
                  >
                    <span className="admin-banner-carousel__add-plus" aria-hidden>
                      +
                    </span>
                    <span>
                      {dragOver ? "Solte aqui" : "Adicionar imagens"}
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          </>
        )}

        {saving ? (
          <p className="admin-banner-slot__hint" aria-live="polite">
            Salvando slides…
          </p>
        ) : null}
        {moving ? (
          <p className="admin-banner-slot__hint" aria-live="polite">
            Reordenando…
          </p>
        ) : null}
        {!canAdd && remaining <= 0 && items.length > 0 ? (
          <p className="admin-banner-slot__hint">
            Limite de {slot.maxItems} slides atingido.
          </p>
        ) : null}
        {status ? (
          <p className="admin-banner-slot__hint">{status}</p>
        ) : null}
      </div>
    </section>
  );
}
