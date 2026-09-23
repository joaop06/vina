"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { atelieDesktopQuery } from "./breakpoints";

const PANEL_ID = "atelie-mobile-nav";

function syncBarHeight(toggle: HTMLButtonElement | null) {
  const header = toggle?.closest("header");
  const bar = header?.querySelector<HTMLElement>("[data-atelie-bar]");
  if (!header || !bar) return null;
  header.style.setProperty("--atelie-bar-height", `${bar.offsetHeight}px`);
  return { header, bar };
}

export function useAtelieMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((value) => !value);
  }, []);

  useEffect(() => {
    const toggleEl = toggleRef.current;
    const measured = syncBarHeight(toggleEl);
    if (!measured) return;
    const observer = new ResizeObserver(() => syncBarHeight(toggleEl));
    observer.observe(measured.bar);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKey);
    syncBarHeight(toggleRef.current);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      const toggleEl = toggleRef.current;
      if (toggleEl && toggleEl.offsetParent !== null) {
        toggleEl.focus({ preventScroll: true });
      }
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia(atelieDesktopQuery);
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const onPanelClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a")) close();
    },
    [close],
  );

  return {
    open,
    toggle,
    close,
    toggleRef,
    panelRef,
    onPanelClick,
    panelId: PANEL_ID,
  };
}
