import { PublicFooterSections } from "@/components/public/PublicFooterSections";
import type { SiteConfig } from "@/src/schemas/site-config";
import styles from "./split.module.css";

export function SplitFooter({ site }: { site: SiteConfig }) {
  return (
    <footer className={styles.footer}>
      <PublicFooterSections
        site={site}
        classNames={{
          footerInner: styles.footerInner,
          footerBrand: styles.footerBrand,
          footerBrandName: styles.footerBrandName,
          footerMuted: styles.footerMuted,
          footerLogo: styles.footerLogo,
          footerSection: styles.footerSection,
          footerSectionTitle: styles.footerSectionTitle,
          footerItem: styles.footerItem,
          footerLabel: styles.footerLabel,
          footerSocial: styles.footerSocial,
          footerLinks: styles.footerLinks,
        }}
      />
    </footer>
  );
}
