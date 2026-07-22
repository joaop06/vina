import Link from "next/link";
import { FooterContactBlock } from "@/components/public/footerContact";
import { FooterSocialLinks } from "@/components/public/FooterSocialLinks";
import { StoreBrand } from "@/components/public/StoreBrand";
import type { SiteConfig } from "@/src/schemas/site-config";

export type PublicFooterClassNames = {
  footerInner: string;
  footerBrand: string;
  footerBrandName: string;
  footerMuted: string;
  footerLogo: string;
  footerSlogan?: string;
  footerSection: string;
  footerSectionTitle: string;
  footerItem: string;
  footerLabel: string;
  footerSocial: string;
  footerLinks: string;
};

type Props = {
  site: SiteConfig;
  classNames: PublicFooterClassNames;
  /** Gallery layout shows the slogan under the brand. */
  showSlogan?: boolean;
};

export function PublicFooterSections({
  site,
  classNames,
  showSlogan = false,
}: Props) {
  const showSocial =
    (site.instagram.mostrar && Boolean(site.instagram.url)) ||
    (site.whatsapp.mostrar && Boolean(site.whatsapp.telefone));

  return (
    <div className={`container ${classNames.footerInner}`}>
      <div className={`${classNames.footerSection} ${classNames.footerBrand}`}>
        <p className={classNames.footerSectionTitle}>Loja</p>
        <StoreBrand
          site={site}
          classNames={{
            name: classNames.footerBrandName,
            tag: classNames.footerMuted,
            logo: classNames.footerLogo,
          }}
        />
        {showSlogan && classNames.footerSlogan && site.slogan.trim() ? (
          <p className={classNames.footerSlogan}>{site.slogan}</p>
        ) : null}
      </div>

      <FooterContactBlock
        site={site}
        classNames={{
          section: classNames.footerSection,
          title: classNames.footerSectionTitle,
          item: classNames.footerItem,
          label: classNames.footerLabel,
          muted: classNames.footerMuted,
        }}
      />

      {showSocial ? (
        <div className={classNames.footerSection}>
          <p className={classNames.footerSectionTitle}>Redes</p>
          <FooterSocialLinks site={site} className={classNames.footerSocial} />
        </div>
      ) : null}

      <div className={classNames.footerSection}>
        <p className={classNames.footerSectionTitle}>Links</p>
        <nav className={classNames.footerLinks} aria-label="Links do rodapé">
          <Link href="/sobre">Sobre</Link>
          <Link href="/catalogo">Catálogo</Link>
        </nav>
      </div>
    </div>
  );
}
