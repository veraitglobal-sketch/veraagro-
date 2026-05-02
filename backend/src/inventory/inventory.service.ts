import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';

/**
 * Dynamic Inventory Service
 * Location-based availability calculation
 * If product is in Niš, buyer in Subotica sees longer delivery time
 */
@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Categorize product based on name
   * Returns: 'fruits', 'vegetables', 'grains', or 'other'
   */
  private categorizeProduct(productName: string): string {
    const name = productName.toLowerCase();
    
    // Fruits
    const fruits = [
      'raspberry', 'blackberry', 'blueberry', 'strawberry', 'currant',
      'apple', 'pear', 'plum', 'cherry', 'peach', 'apricot', 'grape',
      'malina', 'kupina', 'borovnica', 'jagoda', 'kruška', 'šljiva', 
      'trešnja', 'breskva', 'kajsija', 'grožđe', 'ribizla'
    ];
    if (fruits.some(fruit => name.includes(fruit))) {
      return 'fruits';
    }
    
    // Vegetables
    const vegetables = [
      'pepper', 'paprika', 'tomato', 'paradajz', 'cucumber', 'krastavac',
      'zucchini', 'tikvica', 'onion', 'luk', 'garlic', 'beli luk',
      'carrot', 'šargarepa', 'potato', 'krompir', 'cabbage', 'kupus',
      'lettuce', 'salata', 'spinach', 'spanać', 'broccoli', 'cauliflower',
      'bean', 'pasulj', 'pea', 'grašak', 'celery', 'celer', 'beet', 'cvekla'
    ];
    if (vegetables.some(veg => name.includes(veg))) {
      return 'vegetables';
    }
    
    // Grains
    const grains = [
      'wheat', 'pšenica', 'corn', 'kukuruz', 'barley', 'ječam',
      'oats', 'zob', 'rye', 'raž', 'rice', 'pirinač', 'millet', 'proso',
      'buckwheat', 'heljda', 'quinoa'
    ];
    if (grains.some(grain => name.includes(grain))) {
      return 'grains';
    }
    
    return 'other';
  }

  /**
   * Get available products for buyer's location
   * Calculates delivery time based on distance
   */
  async getAvailableProducts(buyerCity: string, buyerLocation?: { lat: number; lng: number }) {
    // Get all available inventory
    // Note: If inventory table doesn't exist yet, fallback to Batch table
    let inventory: any[] = [];
    try {
      inventory = await this.prisma.inventory.findMany({
        where: {
          status: 'AVAILABLE',
        },
        include: {
          hubs: true,
          estates: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  // Privacy: Never include lastName, phone, email for Buyer view
                },
              },
            },
          },
          parcels: {
            include: {
              seeds: {
                select: {
                  name: true,
                  serialNumber: true,
                  batchNumber: true,
                },
              },
            },
          },
          batches: {
            include: {
              compliance_photos: {
                select: {
                  id: true,
                  photoUrl: true,
                  photoType: true,
                  isVerified: true,
                },
              },
            },
            take: 1, // Get first batch for photos
          },
        },
      });
    } catch (error: unknown) {
      // Table doesn't exist or no data - try fallback to Batch table
      const msg = error instanceof Error ? error.message : '';
      const prismaCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (msg.includes('does not exist') || prismaCode === 'P2021') {
        // Fallback: Use Batch table for available products
        try {
          const batches = await this.prisma.batches.findMany({
            where: {
              status: {
                in: ['PACKED', 'IN_TRANSIT', 'IN_HUB'],
              },
            },
            include: {
              estates: {
                include: {
                  users: {
                    select: {
                      id: true,
                      firstName: true,
                      // Privacy: Never include lastName, phone, email
                    },
                  },
                },
              },
              parcels: true,
              hubs: true,
            },
            take: 20, // Limit to 20 products for landing page
          });

          // Transform batches to inventory-like format
        inventory = batches.map((batch) => ({
          id: batch.id,
          batchId: batch.batchId, // For digital passport
          productName: batch.productName,
          quantity: batch.quantity,
          unit: batch.unit,
          unitPrice: 0, // Price should come from MarketPrice
          harvestDate: batch.harvestDate,
          hub: batch.hubs || {
            id: 'default',
            name: 'Hamburg Hub',
            city: 'Hamburg',
            location: null,
          },
          estate: batch.estates ? {
            id: batch.estates.id,
            name: batch.estates.name,
            certificationStartDate: batch.estates.certificationStartDate,
            daysRemaining: batch.estates.daysRemaining,
          } : {
            id: batch.estateId || 'unknown',
            name: 'Unknown Estate',
          },
          parcel: batch.parcels ? {
            id: batch.parcels.id,
            cropType: batch.parcels.cropType,
            plantingDate: batch.parcels.plantingDate,
            expectedHarvestDate: batch.parcels.expectedHarvestDate,
          } : null,
          compliancePhotos: [], // Will be added from batches query
        }));
        } catch (batchError) {
          // If Batch table also fails, return empty array
          return [];
        }
      } else {
        throw error;
      }
    }

    // If inventory is empty, try Batch fallback - include more statuses
    if (inventory.length === 0) {
      try {
        const batches = await this.prisma.batches.findMany({
          where: {
            status: {
              in: ['PACKED', 'IN_TRANSIT', 'IN_HUB', 'QUALITY_VERIFIED'],
            },
          },
          include: {
            estates: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    // Privacy: Never include phone, email
                  },
                },
              },
            },
            parcels: {
              include: {
                seeds: {
                  select: {
                    name: true,
                    serialNumber: true,
                    batchNumber: true,
                  },
                },
              },
            },
            hubs: true,
            compliance_photos: {
              select: {
                id: true,
                photoUrl: true,
                photoType: true,
                isVerified: true,
              },
              take: 3, // Limit photos
            },
          },
          orderBy: {
            harvestDate: 'desc', // Show latest harvests first
          },
          take: 50, // Increased limit to show more products
        });

        if (batches.length > 0) {
          inventory = batches.map((batch: any) => ({
            id: batch.id,
            batchId: batch.batchId,
            productName: batch.productName,
            category: this.categorizeProduct(batch.productName),
            quantity: batch.quantity,
            unit: batch.unit,
            unitPrice: 0, // Will be set from market prices
            harvestDate: batch.harvestDate,
            status: batch.status,
            hub: batch.hubs || {
              id: 'default',
              name: 'European Distribution Hub',
              city: 'Europe',
              location: null,
            },
            estate: batch.estates ? {
              id: batch.estates.id,
              name: batch.estates.name,
              location: batch.estates.polygonCoordinates,
              owner: batch.estates.users ? {
                id: batch.estates.users.id,
                firstName: batch.estates.users.firstName,
                lastName: batch.estates.users.lastName,
              } : null,
              certificationStartDate: batch.estates.certificationStartDate,
              daysRemaining: batch.estates.daysRemaining,
            } : {
              id: batch.estateId || 'unknown',
              name: 'Unknown Estate',
            },
            parcel: batch.parcels ? {
              id: batch.parcels.id,
              cropType: batch.parcels.cropType,
              plantingDate: batch.parcels.plantingDate,
              expectedHarvestDate: batch.parcels.expectedHarvestDate,
            } : null,
            compliancePhotos: batch.compliance_photos || [],
          }));
        }
      } catch (batchError) {
        // If Batch query fails, continue to market prices fallback
        console.warn('Batch query failed, trying market prices:', batchError);
      }
      
      // If still no inventory (no batches or batches query failed), use market prices
      if (inventory.length === 0) {
        try {
          const marketPrices = await this.prisma.market_prices.findMany({
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            distinct: ['cropType'],
            take: 50, // Limit to 50 products
          });

          // Create product entries from market prices with categories
          inventory = marketPrices.map((price, index) => ({
            id: `market-${price.id}`,
            batchId: null,
            productName: price.cropType,
            category: this.categorizeProduct(price.cropType),
            quantity: 0, // Unknown quantity - will show as "Available"
            unit: 'kg',
            unitPrice: price.sellPrice || price.buyPrice || 0,
            harvestDate: new Date(),
            status: 'AVAILABLE',
            hub: {
              id: 'default',
              name: 'European Distribution Hub',
              city: 'Europe',
              location: null,
            },
            estate: {
              id: `estate-${index}`,
              name: 'Available from European Producers',
              location: null,
              owner: null,
            },
            parcel: null,
            compliancePhotos: [],
          }));
        } catch (marketError) {
          console.error('Market prices fallback failed:', marketError);
          return [];
        }
      }
    }

    // Get all market prices once (more efficient than querying per product)
    let marketPrices: Map<string, number> = new Map();
    try {
      const prices = await this.prisma.market_prices.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      // Group by cropType, taking the latest price
      prices.forEach((price) => {
        if (!marketPrices.has(price.cropType)) {
          marketPrices.set(price.cropType, price.sellPrice || price.buyPrice || 0);
        }
      });
    } catch (priceError) {
      // If MarketPrice query fails, use default prices
    }

    // Calculate availability for each product and ensure category is set
    const products = inventory.map((item) => {
      // Ensure category is set (if not already set from batches/market prices)
      if (!item.category && item.productName) {
        item.category = this.categorizeProduct(item.productName);
      }
      
      const hubLocation = item.hub?.location as any;
      let estimatedDays = null;
      let isAvailable = true;

      if (buyerLocation && hubLocation) {
        // Calculate distance
        const distance = GeometryUtil.calculateDistance(
          { lat: buyerLocation.lat, lng: buyerLocation.lng },
          { lat: hubLocation.lat || hubLocation.coordinates?.[0]?.lat, lng: hubLocation.lng || hubLocation.coordinates?.[0]?.lng },
        );

        // Estimate delivery days (rough calculation: 100km = 1 day)
        estimatedDays = Math.ceil(distance / 100000); // Convert meters to days

        // If too far (>500km), mark as unavailable
        if (distance > 500000) {
          isAvailable = false;
        }
      } else {
        // City-based calculation (simplified)
        const hubCity = item.hub?.city || 'Hamburg';
        const cityDistance = this.getCityDistance(buyerCity || 'Hamburg', hubCity);
        estimatedDays = cityDistance.days;
        isAvailable = cityDistance.available;
      }

      // Get price from MarketPrice if available, otherwise use unitPrice
      // Map productName to cropType for price lookup
      const finalPrice = marketPrices.get(item.productName) || item.unitPrice || 0;

      // Get compliance photos and batchId
      const compliancePhotos = item.compliancePhotos || item.batches?.[0]?.compliance_photos || [];
      const batchId = item.batchId || item.batches?.[0]?.batchId || item.id;

      return {
        id: item.id,
        batchId, // For digital passport access
        productName: item.productName,
        category: item.category || this.categorizeProduct(item.productName),
        quantity: item.quantity,
        unit: item.unit,
        price: finalPrice,
        unitPrice: finalPrice,
        harvestDate: item.harvestDate ? new Date(item.harvestDate).toISOString() : new Date().toISOString(),
        estate: item.estate ? {
          id: item.estate.id,
          name: item.estate.name,
          certificationStartDate: item.estate.certificationStartDate,
          daysRemaining: item.estate.daysRemaining,
        } : {
          id: 'unknown',
          name: 'Unknown Estate',
        },
        parcel: item.parcel ? {
          id: item.parcel.id,
          cropType: item.parcel.cropType || 'Unknown',
          plantingDate: item.parcel.plantingDate,
          expectedHarvestDate: item.parcel.expectedHarvestDate,
          seed: item.parcel.seeds,
        } : undefined,
        compliancePhotos, // Product photos for display
        isAvailable,
        estimatedDeliveryDays: isAvailable ? estimatedDays : null,
        message: isAvailable
          ? `Available in ${estimatedDays} ${estimatedDays === 1 ? 'day' : 'days'}`
          : 'Currently not available in your location',
      };
    });

    return products;
  }

  /**
   * Add inventory to hub
   */
  async addInventory(data: {
    hubId: string;
    estateId: string;
    parcelId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    expiresAt?: Date;
  }) {
    const hub = await this.prisma.hubs.findUnique({
      where: { id: data.hubId },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    // Calculate available cities (simplified - can be enhanced)
    const availableCities = this.calculateAvailableCities(hub.city);

    const inventory = await this.prisma.inventory.create({
      data: {
        id: crypto.randomUUID(),
        hubId: data.hubId,
        estateId: data.estateId,
        parcelId: data.parcelId,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        status: 'AVAILABLE',
        availableCities,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      },
    });

    return inventory;
  }

  /**
   * Reserve inventory for order
   */
  async reserveInventory(inventoryId: string, quantity: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.quantity < quantity) {
      throw new Error('Insufficient inventory');
    }

    return this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: inventory.quantity - quantity,
        status: inventory.quantity - quantity === 0 ? 'RESERVED' : 'AVAILABLE',
      },
    });
  }

  /**
   * Calculate available cities based on hub location
   */
  private calculateAvailableCities(hubCity: string): string[] {
    // Simplified city mapping (can be enhanced with real distance data)
    const cityMap: Record<string, string[]> = {
      'Beograd': ['Beograd', 'Novi Sad', 'Kragujevac', 'Niš'],
      'Niš': ['Niš', 'Leskovac', 'Vranje', 'Beograd'],
      'Novi Sad': ['Novi Sad', 'Subotica', 'Beograd', 'Zrenjanin'],
      'Subotica': ['Subotica', 'Novi Sad', 'Sombor'],
    };

    return cityMap[hubCity] || [hubCity];
  }

  /**
   * Extract region from address (privacy protection)
   */
  private extractRegion(address?: string, firstName?: string): string {
    if (!address) return 'Unknown Region';
    
    const cityMatch = address.match(/^([^,]+)/);
    if (cityMatch) {
      const city = cityMatch[1].trim();
      if (city.toLowerCase().includes('region') || city.toLowerCase().includes('district')) {
        return city;
      }
      return `${city} Region`;
    }
    
    return 'Unknown Region';
  }

  /**
   * Get city distance (simplified)
   */
  private getCityDistance(city1: string, city2: string): { days: number; available: boolean } {
    // Simplified distance matrix (can be replaced with real data)
    const sameCity = city1 === city2;
    const nearbyCities: Record<string, string[]> = {
      'Beograd': ['Novi Sad', 'Kragujevac'],
      'Niš': ['Leskovac', 'Vranje'],
      'Novi Sad': ['Subotica', 'Sombor'],
    };

    if (sameCity) {
      return { days: 1, available: true };
    }

    const isNearby = nearbyCities[city1]?.includes(city2) || nearbyCities[city2]?.includes(city1);
    
    if (isNearby) {
      return { days: 2, available: true };
    }

    // Far cities
    return { days: 5, available: true }; // Can be made unavailable if too far
  }
}
