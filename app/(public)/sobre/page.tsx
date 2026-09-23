import { getAboutPageModel } from "@/src/foundation/behaviors/view-models";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
import { seoTitleFromTemplate } from "@/src/lib/front/store-copy";
import { getLayout } from "@/components/public/layouts";
import { AboutPageView } from "@/components/public/kit/catalog/AboutPageView";

export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export async function generateMetadata() {
  const site = await getCachedSiteConfig();
  return {
    title: seoTitleFromTemplate(site, site.textos.paginas.sobreTitulo),
  };
}

export default async function SobrePage() {
  const model = await getAboutPageModel();
  const { AboutPage } = getLayout(model.site.layout);
  const Surface = AboutPage ?? AboutPageView;
  return <Surface {...model} />;
}
