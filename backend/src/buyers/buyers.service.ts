import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BuyersService {
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
      topSuppliers,
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
      this.prisma.orders.groupBy({
        by: ['estateId'],
        where: { buyerId },
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
    ]);

    // Get estate names for top suppliers
    const topSuppliersWithNames = await Promise.all(
      topSuppliers.map(async (supplier) => {
        if (!supplier.estateId) return null;
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

    // Group by supplier
    const spendingBySupplierMap = new Map<string, { amount: number; count: number }>();
    ordersForAnalytics.forEach((order) => {
      const estateId = order.estateId || 'Unknown';
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

    // Group orders by estateId for performance metrics
    const ordersByEstate = new Map<string, typeof buyerOrders>();
    buyerOrders.forEach((order) => {
      if (order.estateId) {
        if (!ordersByEstate.has(order.estateId)) {
          ordersByEstate.set(order.estateId, []);
        }
        ordersByEstate.get(order.estateId)!.push(order);
      }
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
}
