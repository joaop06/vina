"use client";

import { HeaderDrawerNav } from "@/components/public/layouts/headerNav";
import type { ResolvedNavEntry } from "@/src/lib/navigation";
import styles from "./atelie-header.module.css";
import { useAtelieMenu } from "./use-atelie-menu";

export function AtelieMobileMenu({ entries }: { entries: ResolvedNavEntry[] }) {
  const menu = useAtelieMenu();
  if (entries.length === 0) return null;

  return (
    <div
      className={styles.mobileNav}
      data-open={menu.open ? "true" : "false"}
    >
      <button
        ref={menu.toggleRef}
        type="button"
        className={styles.menuToggle}
        aria-expanded={menu.open}
        aria-controls={menu.panelId}
        aria-label={menu.open ? "Fechar menu" : "Abrir menu"}
        onClick={menu.toggle}
      >
        <span className={styles.burger} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav
        ref={menu.panelRef}
        id={menu.panelId}
        className={styles.panel}
        aria-label="Principal"
        aria-hidden={menu.open ? undefined : true}
        inert={menu.open ? undefined : true}
        onClick={menu.onPanelClick}
      >
        <HeaderDrawerNav entries={entries} />
      </nav>
    </div>
  );
}
