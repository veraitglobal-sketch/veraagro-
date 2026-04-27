import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { isSystemEstateId } from '../orders/order-fulfillment.util';

function supplierEstateKey(order: { estateId: string; fulfillingEstateId: string | null }) {
  if (order.fulfillingEstateId) return order.fulfillingEstateId;
  if (order.estateId && !isSystemEstateId(order.estateId)) return order.estateId;
  return 'PENDING_FULFILLMENT';
}

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get buyer dashboard statistics
   */
  async getStatistics(buyerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalOrders,
      monthOrders,
      weekOrders,
      totalSpent,
      monthSpent,
      weekSpent,
      pendingOrders,
      activeOrders,
      completedOrders,
      topProducts,
      ordersForSupplierStats,
    ] = await Promise.all([
      this.prisma.orders.count({
        where: { buyerId },
      }),
      this.prisma.orders.count({
        where: {
          buyerId,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.orders.count({
        where: {
          buyerId,
          createdAt: { gte: startOfWeek },
        },
      }),
      this.prisma.orders.aggregate({
        where: {
          buyerId,
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.orders.aggregate({
        where: {
          buyerId,
          createdAt: { gte: startOfMonth },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.orders.aggregate({
        where: {
          buyerId,
          createdAt: { gte: startOfWeek },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.orders.count({
        where: {
          buyerId,
          status: 'PENDING',
        },
      }),
      this.prisma.orders.count({
        where: {
          buyerId,
          status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      }),
      this.prisma.orders.count({
        where: {
          buyerId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.orders.groupBy({
        by: ['productName'],
        where: { buyerId },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.orders.findMany({
        where: { buyerId },
        select: { estateId: true, fulfillingEstateId: true, totalAmount: true },
      }),
    ]);

    const supplierAgg = new Map<string, { sum: number; count: number }>();
    for (const o of ordersForSupplierStats) {
      const k = supplierEstateKey(o);
      const e = supplierAgg.get(k) || { sum: 0, count: 0 };
      e.sum += o.totalAmount || 0;
      e.count += 1;
      supplierAgg.set(k, e);
    }
    const topSuppliers = Array.from(supplierAgg.entries())
      .map(([estateId, v]) => ({
        estateId,
        _sum: { totalAmount: v.sum },
        _count: v.count,
      }))
      .sort((a, b) => (b._sum.totalAmount || 0) - (a._sum.totalAmount || 0))
      .slice(0, 5);

    // Get estate names for top suppliers
    const topSuppliersWithNames = await Promise.all(
      topSuppliers.map(async (supplier) => {
        if (!supplier.estateId) return null;
        if (supplier.estateId === 'PENDING_FULFILLMENT') {
          return {
            estateId: supplier.estateId,
            estateName: 'Awaiting estate assignment',
            farmerName: '—',
            totalSpent: supplier._sum.totalAmount || 0,
            orderCount: supplier._count,
          };
        }
        const estate = await this.prisma.estates.findUnique({
          where: { id: supplier.estateId },
          select: { name: true, users: { select: { firstName: true, lastName: true } } },
        });
        return {
          estateId: supplier.estateId,
          estateName: estate?.name || 'Unknown',
          farmerName: estate?.users ? `${estate.users.firstName} ${estate.users.lastName}` : 'Unknown',
          totalSpent: supplier._sum.totalAmount || 0,
          orderCount: supplier._count,
        };
      }),
    );

    // Get upcoming deliveries (active deliveries)
    const upcomingDeliveries = await this.prisma.deliveries.findMany({
      where: {
        orders: {
          buyerId,
        },
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'],
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            quantity: true,
            unit: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'asc',
      },
      take: 5,
    });

    // Get spending trend (last 6 months)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const ordersForTrend = await this.prisma.orders.findMany({
      where: {
        buyerId,
        createdAt: { gte: sixMonthsAgo },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by month
    const spendingByMonthMap = new Map<string, { amount: number; count: number }>();
    ordersForTrend.forEach((order) => {
      const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = spendingByMonthMap.get(month) || { amount: 0, count: 0 };
      spendingByMonthMap.set(month, {
        amount: existing.amount + (order.totalAmount || 0),
        count: existing.count + 1,
      });
    });

    // Generate all months in range (even if no orders)
    const spendingTrend: { month: string; amount: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const month = date.toISOString().substring(0, 7);
      const data = spendingByMonthMap.get(month) || { amount: 0, count: 0 };
      spendingTrend.push({ month, amount: data.amount, count: data.count });
    }

    return {
      orders: {
        total: totalOrders,
        thisMonth: monthOrders,
        thisWeek: weekOrders,
        pending: pendingOrders,
        active: activeOrders,
        completed: completedOrders,
      },
      spending: {
        total: totalSpent._sum.totalAmount || 0,
        thisMonth: monthSpent._sum.totalAmount || 0,
        thisWeek: weekSpent._sum.totalAmount || 0,
        average: totalOrders > 0 ? (totalSpent._sum.totalAmount || 0) / totalOrders : 0,
      },
      topProducts: topProducts.map((p) => ({
        productName: p.productName,
        totalQuantity: p._sum.quantity || 0,
        orderCount: p._count,
      })),
      topSuppliers: topSuppliersWithNames.filter((s) => s !== null),
      upcomingDeliveries: upcomingDeliveries.map((delivery) => ({
        id: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
        orderNumber: delivery.orders.orderNumber,
        productName: delivery.orders.productName,
        quantity: delivery.orders.quantity,
        unit: delivery.orders.unit,
        status: delivery.status,
        assignedAt: delivery.assignedAt,
        pickedUpAt: delivery.pickedUpAt,
        inTransitAt: delivery.inTransitAt,
        deliveryAddress: delivery.deliveryAddress,
      })),
      spendingTrend,
    };
  }

  /**
   * Get buyer analytics
   */
  async getAnalytics(buyerId: string, startDate?: Date, endDate?: Date) {
    const where: any = { buyerId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.orders.findMany({
      where,
      include: {
        estates: {
          select: {
            id: true,
            name: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ordersForAnalytics = await this.prisma.orders.findMany({
      where: {
        ...where,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        productName: true,
        estateId: true,
        fulfillingEstateId: true,
        quantity: true,
      },
    });

    // Group by month
    const spendingByMonthMap = new Map<string, { amount: number; count: number }>();
    ordersForAnalytics.forEach((order) => {
      const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = spendingByMonthMap.get(month) || { amount: 0, count: 0 };
      spendingByMonthMap.set(month, {
        amount: existing.amount + (order.totalAmount || 0),
        count: existing.count + 1,
      });
    });

    const spendingByMonth = Array.from(spendingByMonthMap.entries())
      .map(([month, data]) => ({ month, amount: data.amount, count: data.count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by product
    const spendingByProductMap = new Map<string, { amount: number; quantity: number }>();
    ordersForAnalytics.forEach((order) => {
      const productName = order.productName || 'Unknown';
      const existing = spendingByProductMap.get(productName) || { amount: 0, quantity: 0 };
      spendingByProductMap.set(productName, {
        amount: existing.amount + (order.totalAmount || 0),
        quantity: existing.quantity + (order.quantity || 0),
      });
    });

    const spendingByProduct = Array.from(spendingByProductMap.entries())
      .map(([productName, data]) => ({
        productName,
        _sum: { totalAmount: data.amount, quantity: data.quantity },
      }))
      .sort((a, b) => b._sum.totalAmount - a._sum.totalAmount);

    // Group by supplier (real farm: fulfilling, else legacy line estate, else pending)
    const spendingBySupplierMap = new Map<string, { amount: number; count: number }>();
    ordersForAnalytics.forEach((order) => {
      const estateId = supplierEstateKey(order);
      const existing = spendingBySupplierMap.get(estateId) || { amount: 0, count: 0 };
      spendingBySupplierMap.set(estateId, {
        amount: existing.amount + (order.totalAmount || 0),
        count: existing.count + 1,
      });
    });

    const spendingBySupplier = Array.from(spendingBySupplierMap.entries())
      .map(([estateId, data]) => ({
        estateId,
        _sum: { totalAmount: data.amount },
        _count: data.count,
      }))
      .sort((a, b) => b._sum.totalAmount - a._sum.totalAmount);

    return {
      orders,
      spendingByMonth,
      spendingByProduct,
      spendingBySupplier,
    };
  }

  /**
   * Get suppliers list
   * Returns all active estates as potential suppliers, with performance metrics for those buyer has ordered from
   */
  async getSuppliers(buyerId: string) {
    // Get all active estates (potential suppliers)
    const allEstates = await this.prisma.estates.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            partnerCode: true,
          },
        },
      },
    });

    // Get all orders from this buyer to calculate performance metrics
    const buyerOrders = await this.prisma.orders.findMany({
      where: { buyerId },
    });

    // Group by fulfilling farm, else legacy line estate (skip only if neither is a real farm)
    const ordersByEstate = new Map<string, typeof buyerOrders>();
    buyerOrders.forEach((order) => {
      const k =
        order.fulfillingEstateId ||
        (order.estateId && !isSystemEstateId(order.estateId) ? order.estateId : null);
      if (!k) return;
      if (!ordersByEstate.has(k)) {
        ordersByEstate.set(k, []);
      }
      ordersByEstate.get(k)!.push(order);
    });

    // Calculate performance metrics for each supplier
    const suppliers = await Promise.all(
      allEstates.map(async (estate) => {
        const supplierOrders = ordersByEstate.get(estate.id) || [];
        const totalSpent = supplierOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const completedOrders = supplierOrders.filter((o) => o.status === 'COMPLETED').length;
        const averageOrderValue = supplierOrders.length > 0 ? totalSpent / supplierOrders.length : 0;
        const lastOrder = supplierOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        return {
          estateId: estate.id,
          estateName: estate.name,
          farmer: estate.users,
          totalOrders: supplierOrders.length,
          completedOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate: lastOrder?.createdAt || null,
          hasOrdered: supplierOrders.length > 0, // Flag to show if buyer has ordered from this supplier
        };
      }),
    );

    // Sort: suppliers with orders first, then by name
    return suppliers.sort((a, b) => {
      if (a.hasOrdered !== b.hasOrdered) {
        return a.hasOrdered ? -1 : 1;
      }
      return a.estateName.localeCompare(b.estateName);
    });
  }

  private emptyCompanyProfile() {
    return {
      company: {
        legalEntity: '',
        taxId: '',
        headquarters: '',
        generalDirector: '',
        financeManager: '',
      },
      deliveryLocations: [] as unknown[],
      authorizedPersonnel: [] as unknown[],
    };
  }

  private normalizeCompanyProfile(raw: unknown) {
    const d = this.emptyCompanyProfile();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return d;
    }
    const o = raw as Record<string, unknown>;
    const c =
      o.company && typeof o.company === 'object' && !Array.isArray(o.company)
        ? (o.company as Record<string, unknown>)
        : {};
    return {
      company: {
        ...d.company,
        legalEntity: String(c.legalEntity ?? d.company.legalEntity),
        taxId: String(c.taxId ?? d.company.taxId),
        headquarters: String(c.headquarters ?? d.company.headquarters),
        generalDirector: String(c.generalDirector ?? d.company.generalDirector),
        financeManager: String(c.financeManager ?? d.company.financeManager),
      },
      deliveryLocations: Array.isArray(o.deliveryLocations) ? o.deliveryLocations : [],
      authorizedPersonnel: Array.isArray(o.authorizedPersonnel) ? o.authorizedPersonnel : [],
    };
  }

  /**
   * Buyer portal + admin: one JSON document per buyer user
   */
  async getCompanyProfile(buyerId: string) {
    let user: {
      id: string;
      roles: UserRole[];
      buyerCompanyProfile: Prisma.JsonValue | null;
    } | null;
    try {
      user = await this.prisma.users.findUnique({
        where: { id: buyerId },
        select: { id: true, roles: true, buyerCompanyProfile: true },
      });
    } catch (e) {
      // e.g. DB not migrated — column `buyerCompanyProfile` missing
      this.logger.warn(
        `getCompanyProfile: full select failed, retrying without JSON column: ${e}`,
      );
      const basic = await this.prisma.users.findUnique({
        where: { id: buyerId },
        select: { id: true, roles: true },
      });
      if (!basic) {
        throw new NotFoundException('User not found');
      }
      if (!basic.roles.includes(UserRole.BUYER)) {
        throw new ForbiddenException('Not a buyer account');
      }
      return this.emptyCompanyProfile();
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.roles.includes(UserRole.BUYER)) {
      throw new ForbiddenException('Not a buyer account');
    }
    return this.normalizeCompanyProfile(user.buyerCompanyProfile);
  }

  async updateCompanyProfile(buyerId: string, body: unknown) {
    const user = await this.prisma.users.findUnique({
      where: { id: buyerId },
      select: { roles: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.roles.includes(UserRole.BUYER)) {
      throw new ForbiddenException('Not a buyer account');
    }
    const normalized = this.normalizeCompanyProfile(body);
    try {
      await this.prisma.users.update({
        where: { id: buyerId },
        data: {
          buyerCompanyProfile: normalized as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      this.logger.error(`updateCompanyProfile failed: ${e}`);
      throw new BadRequestException(
        'Could not save company profile. The database may need the latest migration (buyer company profile). Run: npx prisma migrate deploy',
      );
    }
    return normalized;
  }
}
