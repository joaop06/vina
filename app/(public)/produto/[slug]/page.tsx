import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductDetailModel } from "@/src/foundation/behaviors/view-models";
import {
  getCachedPublicProductSlugs,
  getCachedProductBySlug,
  getCachedSiteConfig,
} from "@/src/lib/cache/storefront-reads";
import { getLayout } from "@/components/public/layouts";
import { ProductDetailClient } from "@/components/public/kit/product/ProductDetailClient";
import ProductLoading from "./loading";

type Props = {
  params: Promise<{ slug: string }>;
};

/** New slugs created after deploy still resolve on demand, then enter ISR. */
export const dynamicParams = true;
export const revalidate = 120; // keep in sync with STOREFRONT_REVALIDATE_SECONDS

export async function generateStaticParams() {
  const products = await getCachedPublicProductSlugs();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);
  if (!product) return { title: "Produto" };
  return { title: product.nome, description: product.descricao };
}

/**
 * PDP HTML is statically cached (ISR). Variant query params (`tamanho`,
 * `cor`, `quantidade`) are applied client-side so searchParams do not opt
 * this route into dynamic rendering.
 */
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [model, site] = await Promise.all([
    getProductDetailModel(slug),
    getCachedSiteConfig(),
  ]);
  if (!model) notFound();

  const { ProductDetail } = getLayout(site.layout);
  const Surface = ProductDetail ?? ProductDetailClient;

  return (
    <Suspense fallback={<ProductLoading />}>
      <Surface {...model} />
    </Suspense>
  );
}
