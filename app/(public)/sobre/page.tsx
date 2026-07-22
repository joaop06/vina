import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
import { formatEnderecoLinha } from "@/src/lib/br/endereco";
import { waLink } from "@/src/lib/wa";
import { InstagramButton } from "@/components/public/InstagramButton";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";

export const metadata = { title: "Sobre" };
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function SobrePage() {
  const site = await getCachedSiteConfig();
  const wa = waLink(site.whatsapp.telefone, site.whatsapp.mensagemPadrao);
  const showWa = site.whatsapp.mostrar;
  const showIg = site.instagram.mostrar;

  return (
    <div className="container sobre-page">
      <h1 className="vn-section-title sobre-page__title">Sobre a {site.nomeLoja}</h1>
      <p className="sobre-page__lead">{site.textos.sobre}</p>

      <div className="sobre-page__list">
        <p className="sobre-page__item">
          <span className="sobre-page__label">Local</span>
          {formatEnderecoLinha(site.endereco)}
        </p>
        <p className="sobre-page__item">
          <span className="sobre-page__label">Horários</span>
          {site.horarios}
        </p>
        <p className="sobre-page__item">
          <span className="sobre-page__label">Trocas</span>
          {site.textos.trocas}
        </p>
      </div>

      {showWa || showIg ? (
        <div className="sobre-page__cta contact-actions">
          {showWa ? (
            <WhatsAppButton href={wa} waSource="sobre">
              Falar no WhatsApp
            </WhatsAppButton>
          ) : null}
          {showIg ? <InstagramButton href={site.instagram.url} /> : null}
        </div>
      ) : null}
    </div>
  );
}
