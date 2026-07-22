import { notFound } from "next/navigation";
import { getProductById } from "@/src/services/products.service";
import { listCategories } from "@/src/services/categories.service";
import { ProductForm } from "@/components/admin/ProductForm";

type Props = { params: Promise<{ id: string }> };

/** Single-entity edit — one `produtos/{id}.json` + categories (Fase 4). */
export default async function ProdutoDetailPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategories(),
  ]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} />;
}
