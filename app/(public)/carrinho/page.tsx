import { notFound } from "next/navigation";
import { getCartPageModel } from "@/src/foundation/behaviors/view-models";
import { CartPageClient } from "@/components/public/kit/cart/CartPageClient";
import { getLayout } from "@/components/public/layouts";

export const metadata = { title: "Carrinho" };
/** Shell is ISR; cart lines resolve client-side from localStorage. */
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export default async function CarrinhoPage() {
  const model = await getCartPageModel();
  if (!model.cartEnabled) {
    notFound();
  }
  const { CartPage } = getLayout(model.site.layout);
  // Products resolved client-side by cart line IDs (GET /api/v1/products/by-ids).
  const Surface = CartPage ?? CartPageClient;
  return <Surface {...model} />;
}
