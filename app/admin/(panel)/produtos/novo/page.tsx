import { listCategories, getSiteConfig } from "@/src/services";
import { ProductForm } from "@/components/admin/produtos/ProductForm";

/** Empty form + categories only — never loads the product catalog (Fase 4). */
export default async function NovoProdutoPage() {
  const [categories, site] = await Promise.all([
    listCategories(),
    getSiteConfig(),
  ]);
  return (
    <ProductForm
      categories={categories}
      dimensoes={site.rotulos.dimensoes}
    />
  );
}
