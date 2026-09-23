import { notFound } from "next/navigation";
import { CartPageClient } from "@/components/public/cart/CartPageClient";
import { getLayout } from "@/components/public/layouts";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
export const metadata = { title: "Carrinho" };
/** Shell is ISR; cart lines resolve client-side from localStorage. */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function CarrinhoPage() {
  const site = await getCachedSiteConfig();
  if (!site.mostrarCarrinho) {
    notFound();
  }
  const { CartPage } = getLayout(site.layout);
  // Products resolved client-side by cart line IDs (GET /api/v1/products/by-ids).
  if (CartPage) {
    return <CartPage site={site} />;
  }
  return <CartPageClient site={site} />;
}
