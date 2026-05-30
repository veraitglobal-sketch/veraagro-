import type { Product } from '../../../lib/api';

export type FilterStatus = 'all' | 'available_now' | 'incoming' | 'reservations';

export interface EnhancedProduct extends Omit<Product, 'harvestDate'> {
  expectedDeliveryDate?: string;
  farmerTrustScore?: number;
  farmerName?: string;
  harvestDate?: string;
  availableQuantity?: number;
  totalQuantity?: number;
  status?: 'available_now' | 'incoming' | 'reservations';
}

export interface FieldStory {
  id: string;
  farmerName: string;
  subtitle: string;
}

export function enhanceProduct(
  product: Product,
  t: (key: string) => string,
): EnhancedProduct {
  const harvestDate = product.harvestDate ? new Date(product.harvestDate) : null;
  const now = new Date();
  const daysUntilHarvest = harvestDate
    ? Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const expectedDelivery = harvestDate
    ? new Date(harvestDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;

  let status: 'available_now' | 'incoming' | 'reservations' = 'available_now';
  if (daysUntilHarvest !== null) {
    if (daysUntilHarvest <= 0) {
      status = 'available_now';
    } else if (daysUntilHarvest <= 7) {
      status = 'incoming';
    } else if (daysUntilHarvest <= 14) {
      status = 'reservations';
    }
  }

  return {
    ...product,
    expectedDeliveryDate: expectedDelivery?.toISOString(),
    farmerTrustScore: product.estate?.owner ? 75 : 50,
    farmerName: product.estate?.owner
      ? `${product.estate.owner.firstName} ${product.estate.owner.lastName}`
      : product.estate?.name || t('buyer.dashboard.unknownGrower'),
    harvestDate: product.harvestDate,
    availableQuantity: product.quantity,
    totalQuantity: product.quantity,
    status,
  };
}
