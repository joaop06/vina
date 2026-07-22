"use client";

import { useEffect, useId, useRef, useState } from "react";
import { listRootCategories } from "@/src/lib/navigation";
import type { NavSurfaceKey } from "@/src/lib/navigation-admin";
import { navItemKindLabel } from "@/src/lib/navigation-admin";
import {
  navItemLabel,
  type NavCategoriasItem,
  type NavItem,
} from "@/src/schemas/navigation";
import type { Category } from "@/src/schemas/category";
import { FieldHint } from "@/components/admin/FieldHint";

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return list;
  next.splice(to, 0, item);
  return next;
}

function CategoriasEditor({
  item,
  roots,
  surfaceKey,
  disabled,
  onChange,
}: {
  item: NavCategoriasItem;
  roots: Category[];
  surfaceKey: NavSurfaceKey;
  disabled?: boolean;
  onChange: (next: NavCategoriasItem) => void;
}) {
  const orderedIds = item.categoriaIds ?? roots.map((r) => r.id);
  const selected = new Set(orderedIds);
  const orderedRoots = orderedIds
    .map((id) => roots.find((r) => r.id === id))
    .filter((r): r is Category => Boolean(r));
  const unselected = roots.filter((r) => !selected.has(r.id));
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function setOrdered(ids: string[]) {
    onChange({ ...item, categoriaIds: ids });
  }

  function toggleRoot(id: string, on: boolean) {
    if (on) {
      setOrdered([...orderedIds.filter((x) => selected.has(x)), id]);
    } else {
      setOrdered(orderedIds.filter((x) => x !== id));
    }
  }

  function onDragReorder(from: number, to: number) {
    setOrdered(moveItem(orderedIds, from, to));
  }

  return (
    <div className="admin-nav-v2__cats">
      <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
        <span>Mostrar subcategorias</span>
        <input
          type="checkbox"
          role="switch"
          checked={item.incluirFilhos}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...item, incluirFilhos: e.target.checked })
          }
        />
        <span className="admin-switch__track" aria-hidden="true" />
      </label>
      <div className="admin-nav-v2__cats-hint">
        Desmarque para esconder; arraste para mudar a ordem.
        <FieldHint text="Por padrão, todas as categorias-raiz aparecem na ordem do catálogo." />
      </div>
      <ul className="admin-nav-v2__cat-list">
        {orderedRoots.map((cat, index) => (
          <li
            key={cat.id}
            className={[
              "admin-nav-v2__cat-row",
              dragIndex === index ? "is-dragging" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex != null && dragIndex !== index) {
                onDragReorder(dragIndex, index);
              }
              setDragIndex(null);
            }}
          >
            <span className="admin-nav-v2__drag" aria-hidden="true">
              ⋮⋮
            </span>
            <label className="admin-nav-v2__cat-check">
              <input
                type="checkbox"
                checked
                disabled={disabled}
                onChange={() => toggleRoot(cat.id, false)}
              />
              <span>{cat.nome}</span>
            </label>
          </li>
        ))}
        {unselected.map((cat) => (
          <li key={cat.id} className="admin-nav-v2__cat-row is-muted">
            <label className="admin-nav-v2__cat-check">
              <input
                type="checkbox"
                checked={false}
                disabled={disabled}
                onChange={() => toggleRoot(cat.id, true)}
              />
              <span>{cat.nome}</span>
            </label>
          </li>
        ))}
      </ul>
      {roots.length === 0 ? (
        <p className="admin-nav-v2__cats-empty">Nenhuma categoria ativa.</p>
      ) : null}
      <details className="admin-nav-v2__advanced">
        <summary>Mais opções</summary>
        <div className="admin-nav-v2__advanced-body">
          {surfaceKey === "header" ? (
            <label className="admin-nav-v2__cats-max">
              <span>Limitar quantidade no cabeçalho</span>
              <input
                className="input"
                type="number"
                min={0}
                max={50}
                disabled={disabled}
                placeholder="Sem limite"
                value={item.maxRaizes ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  onChange({
                    ...item,
                    maxRaizes:
                      raw === ""
                        ? null
                        : Math.min(50, Math.max(0, Number(raw) || 0)),
                  });
                }}
              />
            </label>
          ) : (
            <p className="admin-nav-v2__cats-hint">
              No menu do celular não há limite de categorias na barra superior.
            </p>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={disabled || item.categoriaIds == null}
            onClick={() => onChange({ ...item, categoriaIds: null })}
          >
            Voltar à ordem do catálogo
          </button>
        </div>
      </details>
    </div>
  );
}

type Props = {
  item: NavItem;
  surfaceKey: NavSurfaceKey;
  categories: Category[];
  disabled?: boolean;
  onChange: (next: NavItem) => void;
  onClose: () => void;
};

export function NavItemEditor({
  item,
  surfaceKey,
  categories,
  disabled,
  onChange,
  onClose,
}: Props) {
  const titleId = useId();
  const roots = listRootCategories(categories);

  return (
    <div
      className="admin-nav-v2__item-editor"
      role="region"
      aria-labelledby={titleId}
    >
      <div className="admin-nav-v2__item-editor-head">
        <h4 id={titleId} className="admin-nav-v2__item-editor-title">
          Editar: {navItemLabel(item)}
        </h4>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={disabled}
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
      {item.tipo === "link" ? (
        <label className="admin-form__span">
          <span className="admin-field-label">Nome no menu (opcional)</span>
          <input
            className="input"
            disabled={disabled}
            value={item.rotulo ?? ""}
            placeholder={navItemLabel(item)}
            onChange={(e) =>
              onChange({
                ...item,
                rotulo: e.target.value || undefined,
              })
            }
          />
        </label>
      ) : null}
      {item.tipo === "custom" ? (
        <div className="admin-nav-v2__custom-fields">
          <label className="admin-form__span">
            <span className="admin-field-label">Nome no menu</span>
            <input
              className="input"
              disabled={disabled}
              value={item.rotulo}
              onChange={(e) =>
                onChange({ ...item, rotulo: e.target.value })
              }
            />
          </label>
          <label className="admin-form__span">
            <span className="admin-field-label">Endereço (URL)</span>
            <input
              className="input"
              disabled={disabled}
              value={item.href}
              onChange={(e) =>
                onChange({ ...item, href: e.target.value })
              }
            />
          </label>
          <label className="admin-switch" data-disabled={disabled ? "true" : undefined}>
            <span>Abrir em nova aba</span>
            <input
              type="checkbox"
              role="switch"
              checked={item.externo}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...item, externo: e.target.checked })
              }
            />
            <span className="admin-switch__track" aria-hidden="true" />
          </label>
        </div>
      ) : null}
      {item.tipo === "categorias" ? (
        <CategoriasEditor
          item={item}
          roots={roots}
          surfaceKey={surfaceKey}
          disabled={disabled}
          onChange={(next) => onChange(next)}
        />
      ) : null}
      <p className="admin-nav-v2__item-kind">{navItemKindLabel(item)}</p>
    </div>
  );
}

export function NavItemEditorDialog({
  open,
  item,
  surfaceKey,
  categories,
  disabled,
  onChange,
  onClose,
}: Props & { open: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="admin-nav-v2__dialog"
      onClose={onClose}
    >
      <NavItemEditor
        item={item}
        surfaceKey={surfaceKey}
        categories={categories}
        disabled={disabled}
        onChange={onChange}
        onClose={onClose}
      />
    </dialog>
  );
}
