import "server-only";
import { sobrePageTitle } from "@/src/foundation/behaviors/copy/store-copy";
import { waLink } from "@/src/foundation/behaviors/whatsapp/wa";
import { getCachedSiteConfig } from "@/src/foundation/cache/storefront-reads";
import { formatEnderecoLinha } from "@/src/foundation/platform/br/endereco";
import type { SiteConfig } from "@/src/schemas";

export type AboutPageLabels = {
  local: string;
  horarios: string;
  trocas: string;
  ctaWhatsapp: string;
};

export type AboutPageModel = {
  site: SiteConfig;
  waHref: string;
  showWa: boolean;
  showIg: boolean;
  enderecoLinha: string;
  title: string;
  lead: string;
  labels: AboutPageLabels;
};

export async function getAboutPageModel(): Promise<AboutPageModel> {
  const site = await getCachedSiteConfig();
  const paginas = site.textos.paginas;

  return {
    site,
    waHref: waLink(site.whatsapp.telefone, site.whatsapp.mensagemPadrao),
    showWa: site.whatsapp.mostrar,
    showIg: site.instagram.mostrar,
    enderecoLinha: formatEnderecoLinha(site.endereco),
    title: sobrePageTitle(site),
    lead: site.textos.sobre,
    labels: {
      local: paginas.sobreLabelLocal,
      horarios: paginas.sobreLabelHorarios,
      trocas: paginas.sobreLabelTrocas,
      ctaWhatsapp: paginas.sobreCtaWhatsapp,
    },
  };
}
