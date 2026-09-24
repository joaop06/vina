import { getHomePageModel } from "@/src/foundation/behaviors/view-models";
import { getLayout } from "@/components/public/layouts";

/** Home — Full Route Cache / CDN (ISR). Sections use index pageSize limits. */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function HomePage() {
  const model = await getHomePageModel();
  const { Home } = getLayout(model.site.layout);
  return <Home {...model} />;
}
