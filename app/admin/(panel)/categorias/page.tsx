import { CategoriasClient } from "@/components/admin/categorias/CategoriasClient";
import { listCategories } from "@/src/services/categories.service";

export default async function AdminCategoriasPage() {
  const items = await listCategories();
  return <CategoriasClient initialItems={items} />;
}
