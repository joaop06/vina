import Link from "next/link";
import type { ChromeProps } from "../contract/types";
import { resolveHeaderNav } from "@/components/public/kit/chrome/headerNav";
import { AtelieBrand } from "./header/AtelieBrand";
import { AtelieCartButton } from "./header/AtelieCartButton";
import { AtelieDesktopNav } from "./header/AtelieDesktopNav";
import { AtelieMobileMenu } from "./header/AtelieMobileMenu";
import { atelieFont } from "./header/fonts";
import styles from "./header/atelie-header.module.css";

export function AtelieHeader({ site, categories }: ChromeProps) {
  const { headerEntries, drawerEntries } = resolveHeaderNav(site, categories);

  return (
    <header className={`${styles.header} ${atelieFont.variable}`} data-atelie-header>
      <div className={styles.bar} data-atelie-bar>
        <Link href="/" className={styles.brandLink}>
          <AtelieBrand site={site} />
        </Link>
        <AtelieDesktopNav entries={headerEntries} />
        <div className={styles.actions}>
          <AtelieCartButton visible={Boolean(site.mostrarCarrinho)} />
          <AtelieMobileMenu entries={drawerEntries} />
        </div>
      </div>
    </header>
  );
}
