import Image from "next/image";
import Link from "next/link";
import { BannerFaixa, BannerPromo } from "@/components/public/BannerSlots";
import { InstagramButton } from "@/components/public/InstagramButton";
import { ProductCard } from "@/components/public/ProductCard";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { mediaUrl } from "@/src/lib/front/format";
import { IMAGE_SIZES } from "@/src/lib/front/media-image";
import { pickBanner } from "@/src/lib/front/media";
import type { HomeProps } from "../types";
import { FootMark } from "./FootMark";
import styles from "./split.module.css";

export function SplitHome({
  site,
  banners,
  destaques,
  novos,
  vitrineFallback,
  wa,
}: HomeProps) {
  const hero = pickBanner(banners, "hero");
  const heroImg = mediaUrl(hero?.imagem.path);
  const showFallback =
    destaques.length === 0 && novos.length === 0 && vitrineFallback.length > 0;
  const showWa = site.whatsapp.mostrar;
  const showIg = site.instagram.mostrar;
  const showContactStrip = showWa;

  return (
    <>
      <section className={styles.hero} aria-label="Destaque">
        <div className={styles.heroCopy}>
          <div className={styles.heroCopyInner}>
            <p className={styles.heroEyebrow}>{site.assinatura}</p>
            <h1 className={styles.heroTitle}>{site.nomeLoja}</h1>
            <p className={styles.heroText}>{site.slogan}</p>
            <div className={styles.heroCtas}>
              <Link className={`btn ${styles.heroBtnPrimary}`} href="/catalogo">
                Ver coleção
              </Link>
              {showWa ? (
                <WhatsAppButton
                  href={wa}
                  waSource="home"
                  className="btn btn-whatsapp"
                >
                  WhatsApp
                </WhatsAppButton>
              ) : null}
              {showIg ? (
                <InstagramButton href={site.instagram.url} />
              ) : null}
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          {heroImg ? (
            <>
              <Image
                className={styles.heroImage}
                src={heroImg}
                alt={hero?.imagem.alt || site.nomeLoja}
                fill
                priority
                sizes={IMAGE_SIZES.heroSplit}
              />
              <div className={styles.heroVisualScrim} aria-hidden="true" />
            </>
          ) : (
            <>
              <div
                className={`${styles.heroVisualScrim} ${styles.heroVisualScrimMuted}`}
                aria-hidden="true"
              />
              <FootMark className={styles.footMark} />
            </>
          )}
        </div>
      </section>

      {destaques.length > 0 ? (
        <section className={`container ${styles.section}`}>
          <h2 className={`pq-section-title ${styles.sectionTitle}`}>Destaques</h2>
          <div className="grid-products">
            {destaques.map((p) => (
              <ProductCard key={p.id} product={p} cartEnabled={site.mostrarCarrinho} />
            ))}
          </div>
        </section>
      ) : null}

      {showFallback ? (
        <section className={`container ${styles.section}`}>
          <h2 className={`pq-section-title ${styles.sectionTitle}`}>
            Nossos produtos
          </h2>
          <div className="grid-products">
            {vitrineFallback.map((p) => (
              <ProductCard key={p.id} product={p} cartEnabled={site.mostrarCarrinho} />
            ))}
          </div>
        </section>
      ) : null}

      <BannerFaixa
        banners={banners}
        storeName={site.nomeLoja}
        className={`banner-faixa ${styles.sectionTight}`}
      />

      {novos.length > 0 ? (
        <section className={`container ${styles.sectionTight}`}>
          <h2 className={`pq-section-title ${styles.sectionTitle}`}>
            Lançamentos
          </h2>
          <div className="grid-products">
            {novos.map((p) => (
              <ProductCard key={p.id} product={p} cartEnabled={site.mostrarCarrinho} />
            ))}
          </div>
        </section>
      ) : null}

      <div className={`container ${styles.sectionTight}`}>
        <BannerPromo
          banners={banners}
          storeName={site.nomeLoja}
          className="banner-promo"
        />
      </div>

      {showContactStrip ? (
        <section className={`container ${styles.sectionTight}`}>
          <div className={styles.waStrip}>
            <div>
              <h2>Dúvidas?</h2>
              <p>Fale com a loja pelo WhatsApp.</p>
            </div>
            <div className="contact-actions">
              <WhatsAppButton href={wa} waSource="home_strip">
                Chamar no WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
