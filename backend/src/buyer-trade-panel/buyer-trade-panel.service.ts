import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Stable FK target for pre-orders (not a real farm). Created on first pre-order. */
const PRE_ORDER_ESTATE_ID =
  process.env.PRE_ORDER_ESTATE_ID || 'biov-preorder-system';

@Injectable()
export class BuyerTradePanelService {
  private readonly logger = new Logger(BuyerTradePanelService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * `orders.estateId` must reference a real `estates` row. Pre-orders are not tied
   * to a farm, so we use a single system estate (upserted on first pre-order).
   */
  private async ensurePreOrderEstateId(): Promise<string> {
    const existing = await this.prisma.estates.findFirst({
      where: {
        OR: [{ id: PRE_ORDER_ESTATE_ID }, { id: 'PRE-ORDER' }],
      },
    });
    if (existing) {
      return existing.id;
    }

    const owner =
      (await this.prisma.users.findFirst({
        where: { roles: { has: 'SUPER_ADMIN' } },
      })) || (await this.prisma.users.findFirst({ orderBy: { createdAt: 'asc' } }));

    if (!owner) {
      throw new BadRequestException(
        'Pre-orders are not available: no system user. Contact support.',
      );
    }

    const polygon: Prisma.InputJsonValue = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0.00001],
          [0.00001, 0.00001],
          [0, 0],
        ],
      ],
    };

    await this.prisma.estates.upsert({
      where: { id: PRE_ORDER_ESTATE_ID },
      create: {
        id: PRE_ORDER_ESTATE_ID,
        name: 'Pre-order (system — not a physical farm)',
        ownerId: owner.id,
        estateQrCode: null,
        polygonCoordinates: polygon,
        calculatedArea: 0,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      update: { updatedAt: new Date() },
    });

    this.logger.log(
      `System pre-order estate ready (${PRE_ORDER_ESTATE_ID}, owner ${owner.id})`,
    );
    return PRE_ORDER_ESTATE_ID;
  }

  /**
   * Live Supply & Demand Graph
   * Upoređuje trenutnu zalihu (inventory) sa potražnjom (orders)
   */
  async getSupplyAndDemand() {
    // Get current available stock (inventory + batches)
    const availableInventory = await this.prisma.inventory.findMany({
      where: {
        status: 'AVAILABLE',
      },
      select: {
        productName: true,
        quantity: true,
        unit: true,
      },
    });

    // Get batches that are available
    const availableBatches = await this.prisma.batches.findMany({
      where: {
        status: {
          in: ['PACKED', 'IN_TRANSIT', 'IN_HUB'],
        },
      },
      select: {
        productName: true,
        quantity: true,
        unit: true,
      },
    });

    // Aggregate supply by product
    const supplyMap = new Map<string, { quantity: number; unit: string }>();

    [...availableInventory, ...availableBatches].forEach((item) => {
      const key = item.productName;
      if (!supplyMap.has(key)) {
        supplyMap.set(key, { quantity: 0, unit: item.unit });
      }
      supplyMap.get(key)!.quantity += item.quantity;
    });

    // Get market demand (pending + confirmed orders)
    const orders = await this.prisma.orders.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PAID'],
        },
      },
      select: {
        productName: true,
        quantity: true,
        unit: true,
        createdAt: true,
      },
    });

    // Aggregate demand by product
    const demandMap = new Map<string, { quantity: number; unit: string }>();

    orders.forEach((order) => {
      const key = order.productName;
      if (!demandMap.has(key)) {
        demandMap.set(key, { quantity: 0, unit: order.unit });
      }
      demandMap.get(key)!.quantity += order.quantity;
    });

    // Build comparison data
    const products = new Set([...supplyMap.keys(), ...demandMap.keys()]);
    const comparison = Array.from(products).map((productName) => {
      const supply = supplyMap.get(productName) || { quantity: 0, unit: 'kg' };
      const demand = demandMap.get(productName) || { quantity: 0, unit: 'kg' };
      const shortage = demand.quantity - supply.quantity;
      const isLimited = shortage > 0;

      return {
        productName,
        supply: supply.quantity,
        demand: demand.quantity,
        shortage: isLimited ? shortage : 0,
        unit: supply.unit || demand.unit || 'kg',
        status: isLimited ? 'LIMITED' : 'AVAILABLE',
        warning: isLimited
          ? 'Limited Availability - Price subject to change'
          : null,
      };
    });

    return {
      timestamp: new Date().toISOString(),
      data: comparison,
      summary: {
        totalProducts: comparison.length,
        limitedAvailability: comparison.filter((p) => p.status === 'LIMITED').length,
        availableProducts: comparison.filter((p) => p.status === 'AVAILABLE').length,
      },
    };
  }

  /**
   * Price Escalation Detection
   * Proverava da li je u poslednjih 1h stiglo više od 5 velikih narudžbina
   */
  async checkPriceEscalation(productName?: string) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Get large orders from last hour
    const recentOrders = await this.prisma.orders.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        ...(productName ? { productName } : {}),
        // Large order = quantity > 100kg or totalAmount > 500€
        OR: [
          { quantity: { gt: 100 } },
          { totalAmount: { gt: 500 } },
        ],
      },
      select: {
        id: true,
        productName: true,
        quantity: true,
        totalAmount: true,
        createdAt: true,
        buyerId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by product
    const productGroups = new Map<string, any[]>();
    recentOrders.forEach((order) => {
      if (!productGroups.has(order.productName)) {
        productGroups.set(order.productName, []);
      }
      productGroups.get(order.productName)!.push(order);
    });

    // Check for escalation triggers
    const escalations: Array<{
      productName: string;
      orderCount: number;
      totalQuantity: number;
      totalAmount: number;
      suggestedIncrease: number;
      message: string;
    }> = [];

    productGroups.forEach((orders, productName) => {
      if (orders.length >= 5) {
        const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        escalations.push({
          productName,
          orderCount: orders.length,
          totalQuantity,
          totalAmount,
          suggestedIncrease: 5, // 5% increase
          message: `High Demand Detected! ${orders.length} large orders in last hour. Suggesting +5% price increase for new orders.`,
        });
      }
    });

    return {
      hasEscalation: escalations.length > 0,
      escalations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply surge pricing
   * Admin can increase price for a specific product
   */
  async applySurgePricing(
    productName: string,
    increasePercent: number,
    adminUserId: string,
  ) {
    // Get current market price
    const currentPrice = await this.prisma.market_prices.findFirst({
      where: {
        cropType: productName,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!currentPrice) {
      throw new Error(`No active price found for ${productName}`);
    }

    // Calculate new price
    const newSellPrice = currentPrice.sellPrice * (1 + increasePercent / 100);

    // Create new market price entry
    const newPrice = await this.prisma.market_prices.create({
      data: {
        id: crypto.randomUUID(),
        cropType: productName,
        buyPrice: currentPrice.buyPrice,
        sellPrice: newSellPrice,
        effectiveFrom: new Date(),
        setByUserId: adminUserId || null,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Deactivate old price
    await this.prisma.market_prices.update({
      where: { id: currentPrice.id },
      data: { isActive: false, effectiveTo: new Date() },
    });

    // Log surge pricing event
    this.logger.log(
      `Surge pricing applied: ${productName} - ${increasePercent}% increase (${currentPrice.sellPrice} → ${newSellPrice}) by admin ${adminUserId}`,
    );

    return {
      success: true,
      productName,
      oldPrice: currentPrice.sellPrice,
      newPrice: newSellPrice,
      increasePercent,
      effectiveFrom: newPrice.effectiveFrom,
    };
  }

  /**
   * Harvest Forecast (4 nedelje)
   * Prognoza berbe na osnovu podataka sa parcela
   */
  async getHarvestForecast(weeks: number = 4) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeks * 7);

    // Get parcels with expected harvest dates
    const parcels = await this.prisma.parcels.findMany({
      where: {
        expectedHarvestDate: {
          gte: now,
          lte: endDate,
        },
        cropType: {
          not: null,
        },
      },
      include: {
        estates: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        seeds: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    // Group by week and product
    const forecast: Map<
      string,
      Array<{
        week: string;
        productName: string;
        estimatedQuantity: number;
        unit: string;
        farmCount: number;
        farms: string[];
      }>
    > = new Map();

    parcels.forEach((parcel) => {
      if (!parcel.expectedHarvestDate || !parcel.cropType) return;

      const harvestDate = new Date(parcel.expectedHarvestDate);
      const weekStart = new Date(harvestDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      const productName = parcel.cropType;
      const estimatedQuantity = parcel.calculatedArea
        ? parcel.calculatedArea * 1000 // Rough estimate: 1000kg per hectare
        : 0;

      if (!forecast.has(weekKey)) {
        forecast.set(weekKey, []);
      }

      const weekData = forecast.get(weekKey)!;
      let productEntry = weekData.find((e) => e.productName === productName);

      if (!productEntry) {
        productEntry = {
          week: weekKey,
          productName,
          estimatedQuantity: 0,
          unit: 'kg',
          farmCount: 0,
          farms: [],
        };
        weekData.push(productEntry);
      }

      productEntry.estimatedQuantity += estimatedQuantity;
      productEntry.farmCount += 1;
      if (parcel.estates?.name && !productEntry.farms.includes(parcel.estates.name)) {
        productEntry.farms.push(parcel.estates.name);
      }
    });

    // Convert to array and sort by week
    const forecastArray = Array.from(forecast.values())
      .flat()
      .sort((a, b) => a.week.localeCompare(b.week));

    return {
      forecastPeriod: {
        start: now.toISOString(),
        end: endDate.toISOString(),
        weeks,
      },
      forecast: forecastArray,
      summary: {
        totalProducts: new Set(forecastArray.map((f) => f.productName)).size,
        totalEstimatedQuantity: forecastArray.reduce(
          (sum, f) => sum + f.estimatedQuantity,
          0,
        ),
        totalFarms: new Set(forecastArray.flatMap((f) => f.farms)).size,
      },
    };
  }

  /**
   * Pre-order and lock price
   * Buyer can order ahead and lock the current price
   */
  async createPreOrder(
    buyerId: string,
    productName: string,
    quantity: number,
    unit: string,
    requestedDeliveryDate: Date,
    lockPrice: boolean,
  ) {
    const name = (productName || '').trim();
    if (!name) {
      throw new BadRequestException('Product name is required');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }

    const currentPrice = await this.prisma.market_prices.findFirst({
      where: {
        isActive: true,
        cropType: { equals: name, mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!currentPrice) {
      throw new BadRequestException(
        `No active market price for "${name}". Add it in Admin → Market prices, or check spelling (must match the crop).`,
      );
    }

    const marketSell = currentPrice.sellPrice;
    const unitPrice = marketSell;
    const totalAmount = quantity * unitPrice;
    const estateId = await this.ensurePreOrderEstateId();

    // Create pre-order
    const preOrder = await this.prisma.orders.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber: `PRE-${Date.now()}`,
        buyerId,
        estateId,
        productName: name,
        quantity,
        unit,
        // Schema requires a float; "unlocked" price intent is in deliveryNotes.
        unitPrice,
        totalAmount,
        deliveryAddress: {}, // Will be filled later
        status: 'PENDING',
        deliveryNotes: lockPrice
          ? `Pre-order with locked price: €${unitPrice}/${unit}`
          : 'Pre-order - price subject to change',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const buyer = await this.prisma.users.findUnique({
      where: { id: buyerId },
      select: { firstName: true, lastName: true, email: true },
    });
    const buyerLabel =
      [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ').trim() ||
      buyer?.email ||
      'Buyer';
    const extraNotes = lockPrice
      ? `Pre-order with locked price: €${unitPrice}/${unit}`
      : 'Pre-order - price subject to change';

    void this.emailService
      .sendNewOrderAdminNotification({
        orderNumber: preOrder.orderNumber,
        productName: name,
        quantity,
        unit,
        unitPrice,
        totalAmount,
        buyerName: buyerLabel,
        buyerEmail: buyer?.email,
        estateName: 'Pre-order (no estate yet)',
        isPreOrder: true,
        extraNotes,
      })
      .catch((e) =>
        this.logger.error(`sendNewOrderAdminNotification (pre-order): ${e}`),
      );

    void this.notificationsService
      .notifyAdminsForNewOrder({
        orderNumber: preOrder.orderNumber,
        productName: name,
        totalAmount,
        buyerLabel,
        estateLabel: 'Pre-order',
        isPreOrder: true,
      })
      .catch((e) =>
        this.logger.error(`notifyAdminsForNewOrder (pre-order): ${e}`),
      );

    return {
      success: true,
      order: preOrder,
      priceLocked: lockPrice,
      lockedPrice: lockPrice ? unitPrice : null,
      message: lockPrice
        ? `Pre-order created with locked price: €${unitPrice}/${unit}`
        : 'Pre-order created - price will be confirmed closer to delivery date',
    };
  }

  /**
   * Check and update prices based on inventory levels
   * Automatski ažurira cene kada zaliha padne ispod kritične granice
   */
  async checkAndUpdatePricesBasedOnInventory() {
    // Get all active prices with critical thresholds
    const activePrices = await this.prisma.market_prices.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get latest price per crop type
    const latestPrices = new Map<string, any>();
    activePrices.forEach((price) => {
      if (!latestPrices.has(price.cropType)) {
        latestPrices.set(price.cropType, price);
      }
    });

    // Get current inventory levels
    const availableInventory = await this.prisma.inventory.findMany({
      where: {
        status: 'AVAILABLE',
      },
      select: {
        productName: true,
        quantity: true,
      },
    });

    const availableBatches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['PACKED', 'IN_TRANSIT', 'IN_HUB'] },
      },
      select: {
        productName: true,
        quantity: true,
      },
    });

    // Aggregate stock by product
    const stockMap = new Map<string, number>();
    [...availableInventory, ...availableBatches].forEach((item) => {
      const current = stockMap.get(item.productName) || 0;
      stockMap.set(item.productName, current + item.quantity);
    });

    // Check each product and update price if needed
    const updates: Array<{ productName: string; oldPrice: number; newPrice: number }> = [];

    for (const [productName, price] of latestPrices.entries()) {
      const currentStock = stockMap.get(productName) || 0;
      const criticalThreshold = (price as any).criticalThreshold || 100; // Default 100kg

      // If stock is below critical threshold and price hasn't been updated yet
      if (currentStock < criticalThreshold && currentStock > 0) {
        // Calculate new price (increase by 5% for limited stock)
        const newPrice = price.sellPrice * 1.05;

        // Check if price was already updated (to avoid multiple updates)
        const wasUpdated = (price as any).isLimitedPrice || false;

        if (!wasUpdated) {
          // Create new price entry
          const newPriceEntry = await this.prisma.market_prices.create({
            data: {
              id: crypto.randomUUID(),
              cropType: price.cropType,
              buyPrice: price.buyPrice,
              sellPrice: newPrice,
              effectiveFrom: new Date(),
              setByUserId: price.setByUserId,
              isActive: true,
              // Store metadata
              criticalThreshold: criticalThreshold,
              isLimitedPrice: true,
            } as any,
          });

          // Deactivate old price
          await this.prisma.market_prices.update({
            where: { id: price.id },
            data: { isActive: false, effectiveTo: new Date() },
          });

          updates.push({
            productName,
            oldPrice: price.sellPrice,
            newPrice,
          });

          this.logger.log(
            `Price updated for ${productName}: ${price.sellPrice} → ${newPrice} (stock: ${currentStock} < ${criticalThreshold})`,
          );
        }
      }
    }

    return { updates, timestamp: new Date().toISOString() };
  }

  /**
   * Get real-time prices with categories and availability status
   */
  async getRealTimePrices() {
    const prices = await this.prisma.market_prices.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get latest price per crop type
    const latestPrices = new Map<string, any>();
    prices.forEach((price) => {
      if (!latestPrices.has(price.cropType)) {
        latestPrices.set(price.cropType, price);
      }
    });

    // Categorize products
    const categorizeProduct = (productName: string): string => {
      const name = productName.toLowerCase();
      
      // Fruits
      const fruits = ['raspberry', 'blackberry', 'blueberry', 'strawberry', 'apple', 'pear', 'plum', 'cherry', 'peach', 'apricot', 'grape', 'currant'];
      if (fruits.some(fruit => name.includes(fruit))) {
        return 'Fruits';
      }
      
      // Vegetables
      const vegetables = ['pepper', 'tomato', 'cucumber', 'zucchini', 'onion', 'garlic', 'carrot', 'potato', 'cabbage', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'bean', 'pea'];
      if (vegetables.some(veg => name.includes(veg))) {
        return 'Vegetables';
      }
      
      // Grains
      const grains = ['wheat', 'corn', 'barley', 'oats', 'rye', 'rice', 'millet', 'buckwheat', 'quinoa'];
      if (grains.some(grain => name.includes(grain))) {
        return 'Grains';
      }
      
      // Default
      return 'Other';
    };

    // Get all available products from inventory and batches
    const availableProducts = new Set<string>();
    const productStock = new Map<string, number>();
    
    // From inventory
    const inventory = await this.prisma.inventory.findMany({
      where: { status: 'AVAILABLE' },
      select: { productName: true, quantity: true },
    });
    inventory.forEach(item => {
      availableProducts.add(item.productName);
      const currentStock = productStock.get(item.productName) || 0;
      productStock.set(item.productName, currentStock + item.quantity);
    });
    
    // From batches
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['PACKED', 'IN_TRANSIT', 'IN_HUB'] },
      },
      select: { productName: true, quantity: true },
    });
    batches.forEach(batch => {
      availableProducts.add(batch.productName);
      const currentStock = productStock.get(batch.productName) || 0;
      productStock.set(batch.productName, currentStock + batch.quantity);
    });

    // Build product list with categories
    const productsByCategory = new Map<string, any[]>();
    
    // Determine availability status based on stock levels
    const getAvailabilityStatus = (productName: string, stock: number, criticalThreshold: number | null): 'IN_STOCK' | 'LIMITED' | 'SOLD_OUT' => {
      if (stock === 0) return 'SOLD_OUT';
      const threshold = criticalThreshold || 100; // Default threshold
      if (stock < threshold) return 'LIMITED';
      return 'IN_STOCK';
    };

    // Add products from market prices
    Array.from(latestPrices.values()).forEach((p) => {
      const category = categorizeProduct(p.cropType);
      if (!productsByCategory.has(category)) {
        productsByCategory.set(category, []);
      }
      
      const stock = productStock.get(p.cropType) || 0;
      const criticalThreshold = (p as any).criticalThreshold || null;
      const availabilityStatus = getAvailabilityStatus(p.cropType, stock, criticalThreshold);
      const isLimitedPrice = (p as any).isLimitedPrice || false;

      productsByCategory.get(category)!.push({
        productName: p.cropType,
        category,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        effectiveFrom: p.effectiveFrom,
        lastUpdated: p.updatedAt,
        isAvailable: availableProducts.has(p.cropType),
        stock,
        criticalThreshold,
        availabilityStatus,
        isLimitedPrice,
      });
    });

    // Add products that are available but don't have prices yet
    availableProducts.forEach((productName) => {
      const category = categorizeProduct(productName);
      if (!Array.from(latestPrices.values()).some(p => p.cropType === productName)) {
        if (!productsByCategory.has(category)) {
          productsByCategory.set(category, []);
        }
        
        const stock = productStock.get(productName) || 0;
        const availabilityStatus = getAvailabilityStatus(productName, stock, null);
        
        productsByCategory.get(category)!.push({
          productName,
          category,
          buyPrice: null,
          sellPrice: null,
          effectiveFrom: null,
          lastUpdated: null,
          isAvailable: true,
          needsPricing: true,
          stock,
          availabilityStatus,
        });
      }
    });

    // Convert to array format
    const categories = Array.from(productsByCategory.entries()).map(([category, products]) => ({
      category,
      products: products.sort((a, b) => a.productName.localeCompare(b.productName)),
    }));

    return {
      timestamp: new Date().toISOString(),
      categories,
      allPrices: Array.from(latestPrices.values()).map((p) => ({
        productName: p.cropType,
        category: categorizeProduct(p.cropType),
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        effectiveFrom: p.effectiveFrom,
        lastUpdated: p.updatedAt,
      })),
    };
  }
}

