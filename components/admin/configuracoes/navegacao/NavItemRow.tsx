"use client";

import { useEffect, useRef, useState } from "react";
import { navItemKindLabel } from "@/src/lib/navigation-admin";
import { navItemLabel, type NavItem } from "@/src/schemas/navigation";

type Props = {
  item: NavItem;
  index: number;
  total: number;
  disabled?: boolean;
  dragging: boolean;
  onToggleVisible: () => void;
  onToggleExpand: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
};

export function NavItemRow({
  item,
  index,
  total,
  disabled,
  dragging,
  onToggleVisible,
  onToggleExpand,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDropOn,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = item.visivel !== false;
  const label = navItemLabel(item);
  const kind = navItemKindLabel(item);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  return (
    <li
      className={[
        "admin-nav-v2__row",
        !visible ? "is-hidden-item" : "",
        dragging ? "is-dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onDragStart();
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn();
      }}
    >
      <div className="admin-nav-v2__row-main">
        <span className="admin-nav-v2__drag" aria-hidden="true">
          ⋮⋮
        </span>
        <div className="admin-nav-v2__row-text">
          <span className="admin-nav-v2__row-label">{label}</span>
          <span className="admin-nav-v2__row-kind">{kind}</span>
        </div>
        <button
          type="button"
          className="admin-nav-v2__eye"
          disabled={disabled}
          aria-pressed={visible}
          aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          onClick={onToggleVisible}
        >
          {visible ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 3l18 18M10.5 10.5a3 3 0 004.24 4.24M9.9 5.1A10.8 10.8 0 0112 5c6.5 0 10 7 10 7a16.2 16.2 0 01-4.06 5.94M6.1 6.1C3.6 7.8 2 12 2 12a16.2 16.2 0 005.94 4.94"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <div className="admin-nav-v2__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="admin-nav-v2__menu-btn"
            disabled={disabled}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Ações para ${label}`}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ⋯
          </button>
          {menuOpen ? (
            <div className="admin-nav-v2__menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="admin-nav-v2__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleExpand();
                }}
              >
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                className="admin-nav-v2__menu-item"
                disabled={index === 0}
                onClick={() => {
                  setMenuOpen(false);
                  onMoveUp();
                }}
              >
                Mover para cima
              </button>
              <button
                type="button"
                role="menuitem"
                className="admin-nav-v2__menu-item"
                disabled={index >= total - 1}
                onClick={() => {
                  setMenuOpen(false);
                  onMoveDown();
                }}
              >
                Mover para baixo
              </button>
              <button
                type="button"
                role="menuitem"
                className="admin-nav-v2__menu-item admin-nav-v2__menu-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove();
                }}
              >
                Remover
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
