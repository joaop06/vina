import { PersonalizacaoClient } from "@/components/admin/PersonalizacaoClient";
import {
  getCachedActiveCategories,
  getCachedAllBanners,
  getCachedSiteConfig,
} from "@/src/lib/cache/storefront-reads";

type Props = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function AdminPersonalizacaoPage({ searchParams }: Props) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const [config, items, categories] = await Promise.all([
    getCachedSiteConfig(),
    getCachedAllBanners(),
    getCachedActiveCategories(),
  ]);
  return (
    <PersonalizacaoClient
      initialConfig={config}
      initialBanners={items}
      initialCategories={categories}
      initialTab={tabParam}
    />
  );
}
