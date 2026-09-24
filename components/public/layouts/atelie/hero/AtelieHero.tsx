import Image from "next/image";
import Link from "next/link";
import { WhatsAppButton } from "@/components/public/kit/feedback/WhatsAppButton";
import { IMAGE_SIZES } from "@/src/foundation/behaviors/media/media-image";
import type { HomeProps } from "../../contract/types";
import { atelieFont } from "../header/fonts";
import { resolveAtelieHero, type AtelieHeroAction } from "./resolve-atelie-hero";
import { resolveAtelieHeroFrame } from "./resolve-atelie-media";
import styles from "./atelie-hero.module.css";

function TruckIcon() {
  return (
    <svg
      className={styles.noteIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4l3 3v2h-7" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function HeroAction({ action }: { action: AtelieHeroAction }) {
  const className = [
    styles.btn,
    action.estilo === "preenchido" ? styles.btnFill : styles.btnOutline,
  ].join(" ");

  if (action.kind === "whatsapp") {
    return (
      <WhatsAppButton
        href={action.href}
        waSource="home"
        showIcon={false}
        className={className}
      >
        {action.rotulo}
      </WhatsAppButton>
    );
  }

  if (action.href.startsWith("/")) {
    return (
      <Link className={className} href={action.href}>
        {action.rotulo}
      </Link>
    );
  }

  return (
    <a className={className} href={action.href} target="_blank" rel="noreferrer">
      {action.rotulo}
    </a>
  );
}

export function AtelieHero({ site }: HomeProps) {
  const { copy, actions } = resolveAtelieHero(site.atelie.hero, {
    assinatura: site.assinatura,
    nomeLoja: site.nomeLoja,
    slogan: site.slogan,
    verColecao: site.textos.home.verColecao,
    whatsappCurto: site.textos.home.whatsappCurto,
    whatsappMostrar: site.whatsapp.mostrar,
    telefone: site.whatsapp.telefone,
    mensagemPadrao: site.whatsapp.mensagemPadrao,
  });
  const frame = resolveAtelieHeroFrame(site.atelie.hero.midia, site.nomeLoja);
  const legenda =
    frame && (copy.legendaTitulo || copy.legendaTexto)
      ? { titulo: copy.legendaTitulo, texto: copy.legendaTexto }
      : null;
  const hasCopy =
    Boolean(copy.eyebrow || copy.titulo || copy.tituloDestaque || copy.texto || copy.nota) ||
    actions.length > 0;

  if (!hasCopy && !frame) return null;

  return (
    <section
      className={`${styles.hero} ${atelieFont.variable}`}
      aria-label="Destaque"
    >
      <div className={styles.inner}>
      {hasCopy ? (
        <div className={styles.copy}>
          {copy.eyebrow ? <p className={styles.eyebrow}>{copy.eyebrow}</p> : null}
          {copy.titulo || copy.tituloDestaque ? (
            <h1 className={styles.title}>
              {copy.titulo ? <span className={styles.titleMain}>{copy.titulo}</span> : null}
              {copy.tituloDestaque ? (
                <span className={styles.titleAccent}>{copy.tituloDestaque}</span>
              ) : null}
            </h1>
          ) : null}
          {copy.texto ? <p className={styles.lead}>{copy.texto}</p> : null}
          {actions.length > 0 ? (
            <div className={styles.actions}>
              {actions.map((action) => (
                <HeroAction key={`${action.kind}-${action.rotulo}`} action={action} />
              ))}
            </div>
          ) : null}
          {copy.nota ? (
            <p className={styles.note}>
              <TruckIcon />
              <span>{copy.nota}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {frame ? (
        <div className={styles.visual}>
          <div className={styles.frame}>
            <div className={styles.media}>
              {frame.kind === "image" && frame.local ? (
                <Image
                  className={styles.image}
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  priority
                  sizes={IMAGE_SIZES.heroSplit}
                />
              ) : null}
              {frame.kind === "image" && !frame.local ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.remote} src={frame.src} alt={frame.alt} />
              ) : null}
              {frame.kind === "file" ? (
                <video
                  className={styles.video}
                  src={frame.src}
                  aria-label={frame.alt}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : null}
              {frame.kind === "embed" ? (
                <iframe
                  className={styles.embed}
                  src={frame.src}
                  title={frame.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  tabIndex={-1}
                />
              ) : null}
            </div>
            {legenda ? (
              <div className={styles.caption}>
                {legenda.titulo ? (
                  <p className={styles.captionTitle}>{legenda.titulo}</p>
                ) : null}
                {legenda.texto ? (
                  <p className={styles.captionText}>{legenda.texto}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
    </section>
  );
}
