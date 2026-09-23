import { listCategories } from "@/src/services";
import { CategoriasClient } from "@/components/admin/categorias/CategoriasClient";

export default async function AdminCategoriasPage() {
  const items = await listCategories();
  return <CategoriasClient initialItems={items} />;
}
