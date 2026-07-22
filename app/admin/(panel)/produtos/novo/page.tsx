import { listCategories } from "@/src/services/categories.service";
import { ProductForm } from "@/components/admin/ProductForm";

/** Empty form + categories only — never loads the product catalog (Fase 4). */
export default async function NovoProdutoPage() {
  const categories = await listCategories();
  return <ProductForm categories={categories} />;
}
