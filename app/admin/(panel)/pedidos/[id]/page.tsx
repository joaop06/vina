import { getOrder } from "@/src/services";
import { notFound } from "next/navigation";
import {
  getCachedClients,
  getCachedProductsByIds,
} from "@/src/foundation/cache/storefront-reads";
import { PedidoForm } from "@/components/admin/pedidos/PedidoForm";

type Props = { params: Promise<{ id: string }> };

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const productIds = order.itens.map((item) => item.produtoId);
  const [products, clients] = await Promise.all([
    getCachedProductsByIds(productIds),
    getCachedClients(),
  ]);

  return (
    <PedidoForm order={order} products={products} clients={clients} />
  );
}
