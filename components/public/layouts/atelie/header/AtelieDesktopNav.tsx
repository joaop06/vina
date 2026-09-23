import { HeaderDesktopNav } from "@/components/public/kit/chrome/headerNav";
import type { ResolvedNavEntry } from "@/src/lib/navigation";
import styles from "./atelie-header.module.css";

export function AtelieDesktopNav({ entries }: { entries: ResolvedNavEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <nav className={styles.desktopNav} aria-label="Principal">
      <HeaderDesktopNav entries={entries} />
    </nav>
  );
}
