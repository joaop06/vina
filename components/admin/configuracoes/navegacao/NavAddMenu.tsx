"use client";

import { useEffect, useRef, useState } from "react";
import {
  createCustomNavItem,
  type NavItem,
} from "@/src/schemas/navigation";

type Props = {
  itens: NavItem[];
  surfaceKey: "header" | "drawer";
  disabled?: boolean;
  onAdd: (item: NavItem) => void;
};

export function NavAddMenu({ itens, surfaceKey, disabled, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  function addBuiltin(chave: "inicio" | "catalogo" | "sobre") {
    if (itens.some((i) => i.tipo === "link" && i.chave === chave)) return;
    onAdd({
      id: `${surfaceKey}-link-${chave}-${Date.now()}`,
      tipo: "link",
      chave,
      visivel: true,
    });
    setOpen(false);
  }

  function addCategorias() {
    if (itens.some((i) => i.tipo === "categorias")) return;
    onAdd({
      id: `${surfaceKey}-categorias-${Date.now()}`,
      tipo: "categorias",
      visivel: true,
      categoriaIds: null,
      maxRaizes: surfaceKey === "header" ? 4 : null,
      incluirFilhos: true,
    });
    setOpen(false);
  }

  function addCustom() {
    onAdd(createCustomNavItem());
    setOpen(false);
  }

  const hasCat = itens.some((i) => i.tipo === "categorias");
  const hasInicio = itens.some((i) => i.tipo === "link" && i.chave === "inicio");
  const hasCatalogo = itens.some(
    (i) => i.tipo === "link" && i.chave === "catalogo",
  );
  const hasSobre = itens.some((i) => i.tipo === "link" && i.chave === "sobre");

  return (
    <div className="admin-nav-v2__add-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        + Adicionar ao menu
      </button>
      {open ? (
        <div className="admin-nav-v2__add-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="admin-nav-v2__add-item"
            disabled={hasInicio}
            onClick={() => addBuiltin("inicio")}
          >
            Início
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-nav-v2__add-item"
            disabled={hasCatalogo}
            onClick={() => addBuiltin("catalogo")}
          >
            Catálogo
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-nav-v2__add-item"
            disabled={hasSobre}
            onClick={() => addBuiltin("sobre")}
          >
            Sobre
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-nav-v2__add-item"
            disabled={hasCat}
            onClick={addCategorias}
          >
            Categorias
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-nav-v2__add-item"
            onClick={addCustom}
          >
            Link personalizado
          </button>
        </div>
      ) : null}
    </div>
  );
}
