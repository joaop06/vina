import { PersonalizacaoClient } from "@/components/admin/PersonalizacaoClient";
import {
  getCachedActiveCategories,
  getCachedAllBanners,
} from "@/src/lib/cache/storefront-reads";
import { getSiteConfigTab } from "@/src/services/site-config.service";
import { parseConfigTab } from "@/components/admin/configuracoes/configTabs";
import { DEFAULT_SITE_CONFIG } from "@/src/config/default-site-config";
import { mergeTabIntoConfig } from "@/src/schemas/site-config-tabs";
import type { Banner } from "@/src/schemas/banner";
import type { Category } from "@/src/schemas/category";

type Props = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function AdminPersonalizacaoPage({ searchParams }: Props) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = parseConfigTab(tabParam);

  const tabResponse = await getSiteConfigTab(initialTab);
  const initialConfig = mergeTabIntoConfig(
    {
      ...DEFAULT_SITE_CONFIG,
      versao: tabResponse.versao,
      atualizadoEm: tabResponse.atualizadoEm,
    },
    initialTab,
    tabResponse.data,
  );

  let initialBanners: Banner[] = [];
  let initialCategories: Category[] = [];

  if (initialTab === "vitrine") {
    initialBanners = await getCachedAllBanners();
  }
  if (initialTab === "vitrine" || initialTab === "navegacao") {
    initialCategories = await getCachedActiveCategories();
  }

  return (
    <PersonalizacaoClient
      initialConfig={initialConfig}
      initialTab={initialTab}
      initialLoadedTabs={[initialTab]}
      initialBanners={initialBanners}
      initialCategories={initialCategories}
    />
  );
}
