import { prisma } from '@/lib/db';
import { Order } from '@/types/order';
import { ProductCategory, ProductCondition, RefundStatus } from '@prisma/client';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const FALLBACK_ORDERS: Order[] = [
  {
    id: 'ord_101_valid_within_policy',
    customerId: 'cust_001_valid',
    productCategory: ProductCategory.ELECTRONICS,
    amount: 4999.00,
    orderDate: daysAgo(10),
    deliveryDate: daysAgo(7),
    productCondition: ProductCondition.UNOPENED,
    isFinalSale: false,
    refundStatus: RefundStatus.NONE,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ord_201_outside_30_days',
    customerId: 'cust_002_expired',
    productCategory: ProductCategory.CLOTHING,
    amount: 2499.00,
    orderDate: daysAgo(50),
    deliveryDate: daysAgo(45),
    productCondition: ProductCondition.UNOPENED,
    isFinalSale: false,
    refundStatus: RefundStatus.NONE,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ord_301_final_sale',
    customerId: 'cust_003_final_sale',
    productCategory: ProductCategory.SOFTWARE,
    amount: 1999.00,
    orderDate: daysAgo(12),
    deliveryDate: daysAgo(10),
    productCondition: ProductCondition.UNOPENED,
    isFinalSale: true,
    refundStatus: RefundStatus.NONE,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ord_601_above_10k',
    customerId: 'cust_006_high_value',
    productCategory: ProductCategory.ELECTRONICS,
    amount: 24999.00,
    orderDate: daysAgo(8),
    deliveryDate: daysAgo(5),
    productCondition: ProductCondition.UNOPENED,
    isFinalSale: false,
    refundStatus: RefundStatus.NONE,
    createdAt: now,
    updatedAt: now,
  },
];

export class OrderService {
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) return order;
    } catch (e) {
      console.warn('PostgreSQL offline, using memory order fallback.');
    }
    return FALLBACK_ORDERS.find((o) => o.id === orderId) || null;
  }

  static async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { orderDate: 'desc' },
      });
      if (orders.length > 0) return orders;
    } catch (e) {
      console.warn('PostgreSQL offline, using memory order fallback.');
    }
    return FALLBACK_ORDERS.filter((o) => o.customerId === customerId);
  }
}
