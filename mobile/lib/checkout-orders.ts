import type { CartItem } from './cart-store';

/** Acknowledged orders leave the cart immediately, including when a later line fails. */
export async function submitCartOrders(
  items: CartItem[],
  create: (line: CartItem) => Promise<{ id: string; quantity?: number }>,
  consume: (line: CartItem) => void | Promise<void>,
  missingIdMessage: string,
): Promise<{ createdIds: string[]; error?: unknown }> {
  const createdIds: string[] = [];
  try {
    for (const line of items) {
      const order = await create(line);
      if (!order?.id) throw new Error(missingIdMessage);
      createdIds.push(order.id);
      await consume({ ...line, quantity: typeof order.quantity === 'number' && order.quantity > 0 ? order.quantity : line.quantity });
    }
    return { createdIds };
  } catch (error) {
    return { createdIds, error };
  }
}
