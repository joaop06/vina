import Image from "next/image";
import { mediaUrl } from "@/src/lib/front/format";
import type { SiteConfig } from "@/src/schemas/site-config";
import styles from "./atelie-header.module.css";

type Props = {
  site: Pick<SiteConfig, "nomeLoja" | "assinatura" | "logo">;
};

export function AtelieBrand({ site }: Props) {
  const src = mediaUrl(site.logo?.path);

  return (
    <span className={styles.brand}>
      {src ? (
        <Image
          src={src}
          alt=""
          width={64}
          height={64}
          className={styles.logo}
          sizes="64px"
          priority
        />
      ) : null}
      <span className={styles.brandCopy}>
        <span className={styles.brandName}>{site.nomeLoja}</span>
        {site.assinatura.trim() ? (
          <span className={styles.brandTag}>{site.assinatura}</span>
        ) : null}
      </span>
    </span>
  );
}
