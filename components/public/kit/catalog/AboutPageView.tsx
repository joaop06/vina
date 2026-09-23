import { InstagramButton } from "@/components/public/kit/feedback/InstagramButton";
import { WhatsAppButton } from "@/components/public/kit/feedback/WhatsAppButton";
import type { AboutPageModel } from "@/src/foundation/behaviors/view-models";

/** Kit fallback for /sobre — same markup as the former inline page JSX. */
export function AboutPageView({
  site,
  waHref,
  showWa,
  showIg,
  enderecoLinha,
  title,
  lead,
  labels,
}: AboutPageModel) {
  return (
    <div className="container sobre-page">
      <h1 className="vn-section-title sobre-page__title">{title}</h1>
      <p className="sobre-page__lead">{lead}</p>

      <div className="sobre-page__list">
        <p className="sobre-page__item">
          <span className="sobre-page__label">{labels.local}</span>
          {enderecoLinha}
        </p>
        <p className="sobre-page__item">
          <span className="sobre-page__label">{labels.horarios}</span>
          {site.horarios}
        </p>
        <p className="sobre-page__item">
          <span className="sobre-page__label">{labels.trocas}</span>
          {site.textos.trocas}
        </p>
      </div>

      {showWa || showIg ? (
        <div className="sobre-page__cta contact-actions">
          {showWa ? (
            <WhatsAppButton href={waHref} waSource="sobre">
              {labels.ctaWhatsapp}
            </WhatsAppButton>
          ) : null}
          {showIg ? <InstagramButton href={site.instagram.url} /> : null}
        </div>
      ) : null}
    </div>
  );
}
