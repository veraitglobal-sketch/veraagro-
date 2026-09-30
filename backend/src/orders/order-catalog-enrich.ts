import { PrismaService } from '../prisma/prisma.service';

export type CatalogReserveFields = {
  catalogReserved: boolean;
  catalogReservedKg: number | null;
};

export async function enrichOrdersWithCatalogReserve<T extends { id: string; catalogProductId: string | null }>(
  prisma: PrismaService,
  orders: T[],
): Promise<Array<T & CatalogReserveFields>> {
  const catalogOrderIds = orders.filter((o) => o.catalogProductId).map((o) => o.id);
  if (catalogOrderIds.length === 0) {
    return orders.map((o) => ({ ...o, catalogReserved: false, catalogReservedKg: null }));
  }

  const movements = await prisma.catalog_stock_movements.findMany({
    where: {
      orderId: { in: catalogOrderIds },
      type: { in: ['ORDER_RESERVE', 'ORDER_RELEASE'] },
    },
    select: { orderId: true, type: true, quantityKg: true },
  });

  const reserveKgByOrder = new Map<string, number>();
  const released = new Set<string>();
  for (const m of movements) {
    if (!m.orderId) continue;
    if (m.type === 'ORDER_RELEASE') released.add(m.orderId);
    else if (m.type === 'ORDER_RESERVE') reserveKgByOrder.set(m.orderId, Math.abs(m.quantityKg));
  }

  return orders.map((o) => {
    const hasReserve = !!o.catalogProductId && reserveKgByOrder.has(o.id) && !released.has(o.id);
    return {
      ...o,
      catalogReserved: hasReserve,
      catalogReservedKg: hasReserve ? reserveKgByOrder.get(o.id)! : null,
    };
  });
}

export function orderHasReservedStock(order: {
  catalogProductId?: string | null;
  catalogReserved?: boolean;
  stockReservation?: { status?: string } | null;
}): boolean {
  if (order.catalogProductId) return !!order.catalogReserved;
  return order.stockReservation?.status === 'RESERVED';
}
