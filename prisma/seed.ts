import { PrismaClient, CustomerTier, ProductCategory, ProductCondition, RefundStatus, RefundDecisionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding for AI Refund Support Agent...');

  // Clean existing records in reverse dependency order
  await prisma.agentLog.deleteMany();
  await prisma.agentExecution.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Define exactly 15 Realistic Customers with designated test scenarios
  const customersData = [
    {
      id: 'cust_001_valid',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+919876543210',
      tier: CustomerTier.VIP,
      totalOrders: 5,
      orders: [
        {
          id: 'ord_101_valid_within_policy',
          productCategory: ProductCategory.ELECTRONICS,
          amount: 4999.00,
          orderDate: daysAgo(10),
          deliveryDate: daysAgo(7),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        },
        {
          id: 'ord_102_delivered_recent',
          productCategory: ProductCategory.BOOKS,
          amount: 899.00,
          orderDate: daysAgo(15),
          deliveryDate: daysAgo(12),
          productCondition: ProductCondition.OPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_002_expired',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+919876543211',
      tier: CustomerTier.REGULAR,
      totalOrders: 3,
      orders: [
        {
          id: 'ord_201_outside_30_days',
          productCategory: ProductCategory.CLOTHING,
          amount: 2499.00,
          orderDate: daysAgo(50),
          deliveryDate: daysAgo(45), // > 30 days ago
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_003_final_sale',
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      phone: '+919876543212',
      tier: CustomerTier.NEW,
      totalOrders: 1,
      orders: [
        {
          id: 'ord_301_final_sale',
          productCategory: ProductCategory.SOFTWARE,
          amount: 1999.00,
          orderDate: daysAgo(12),
          deliveryDate: daysAgo(10),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: true, // Clearance / Final Sale item
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_004_already_refunded',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+919876543213',
      tier: CustomerTier.VIP,
      totalOrders: 8,
      orders: [
        {
          id: 'ord_401_already_refunded',
          productCategory: ProductCategory.HOME,
          amount: 3499.00,
          orderDate: daysAgo(20),
          deliveryDate: daysAgo(18),
          productCondition: ProductCondition.DEFECTIVE,
          isFinalSale: false,
          refundStatus: RefundStatus.REFUNDED,
        }
      ]
    },
    {
      id: 'cust_005_used_product',
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+919876543214',
      tier: CustomerTier.REGULAR,
      totalOrders: 2,
      orders: [
        {
          id: 'ord_501_used_product',
          productCategory: ProductCategory.ELECTRONICS,
          amount: 7999.00,
          orderDate: daysAgo(14),
          deliveryDate: daysAgo(11),
          productCondition: ProductCondition.USED, // Used product violates policy
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_006_high_value',
      name: 'Kavya Nair',
      email: 'kavya.nair@example.com',
      phone: '+919876543215',
      tier: CustomerTier.VIP,
      totalOrders: 12,
      orders: [
        {
          id: 'ord_601_above_10k',
          productCategory: ProductCategory.ELECTRONICS,
          amount: 24999.00, // Above ₹10,000 threshold
          orderDate: daysAgo(8),
          deliveryDate: daysAgo(5),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_007_another_valid',
      name: 'Aditya Gupta',
      email: 'aditya.gupta@example.com',
      phone: '+919876543216',
      tier: CustomerTier.REGULAR,
      totalOrders: 4,
      orders: [
        {
          id: 'ord_701_valid_customer_2',
          productCategory: ProductCategory.HOME,
          amount: 1850.00,
          orderDate: daysAgo(15),
          deliveryDate: daysAgo(13),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_008_standard',
      name: 'Diya Reddy',
      email: 'diya.reddy@example.com',
      phone: '+919876543217',
      tier: CustomerTier.NEW,
      totalOrders: 1,
      orders: [
        {
          id: 'ord_801_standard',
          productCategory: ProductCategory.CLOTHING,
          amount: 1299.00,
          orderDate: daysAgo(5),
          deliveryDate: daysAgo(3),
          productCondition: ProductCondition.OPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_009_standard',
      name: 'Siddharth Rao',
      email: 'siddharth.rao@example.com',
      phone: '+919876543218',
      tier: CustomerTier.REGULAR,
      totalOrders: 6,
      orders: [
        {
          id: 'ord_901_standard',
          productCategory: ProductCategory.BOOKS,
          amount: 650.00,
          orderDate: daysAgo(22),
          deliveryDate: daysAgo(19),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_010_standard',
      name: 'Meera Deshmukh',
      email: 'meera.deshmukh@example.com',
      phone: '+919876543219',
      tier: CustomerTier.VIP,
      totalOrders: 15,
      orders: [
        {
          id: 'ord_1001_standard',
          productCategory: ProductCategory.ELECTRONICS,
          amount: 8500.00,
          orderDate: daysAgo(16),
          deliveryDate: daysAgo(14),
          productCondition: ProductCondition.DEFECTIVE,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_011_standard',
      name: 'Kabir Chatterjee',
      email: 'kabir.chatterjee@example.com',
      phone: '+919876543220',
      tier: CustomerTier.NEW,
      totalOrders: 2,
      orders: [
        {
          id: 'ord_1101_standard',
          productCategory: ProductCategory.SOFTWARE,
          amount: 4500.00,
          orderDate: daysAgo(9),
          deliveryDate: daysAgo(7),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_012_standard',
      name: 'Neha Joshi',
      email: 'neha.joshi@example.com',
      phone: '+919876543221',
      tier: CustomerTier.REGULAR,
      totalOrders: 3,
      orders: [
        {
          id: 'ord_1201_standard',
          productCategory: ProductCategory.CLOTHING,
          amount: 3200.00,
          orderDate: daysAgo(28),
          deliveryDate: daysAgo(25),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_013_standard',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      phone: '+919876543222',
      tier: CustomerTier.VIP,
      totalOrders: 9,
      orders: [
        {
          id: 'ord_1301_standard',
          productCategory: ProductCategory.HOME,
          amount: 6700.00,
          orderDate: daysAgo(11),
          deliveryDate: daysAgo(9),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_014_standard',
      name: 'Tara Kapoor',
      email: 'tara.kapoor@example.com',
      phone: '+919876543223',
      tier: CustomerTier.NEW,
      totalOrders: 1,
      orders: [
        {
          id: 'ord_1401_standard',
          productCategory: ProductCategory.BOOKS,
          amount: 420.00,
          orderDate: daysAgo(4),
          deliveryDate: daysAgo(2),
          productCondition: ProductCondition.UNOPENED,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    },
    {
      id: 'cust_015_standard',
      name: 'Yash Agarwal',
      email: 'yash.agarwal@example.com',
      phone: '+919876543224',
      tier: CustomerTier.REGULAR,
      totalOrders: 4,
      orders: [
        {
          id: 'ord_1501_standard',
          productCategory: ProductCategory.ELECTRONICS,
          amount: 9200.00,
          orderDate: daysAgo(18),
          deliveryDate: daysAgo(15),
          productCondition: ProductCondition.DEFECTIVE,
          isFinalSale: false,
          refundStatus: RefundStatus.NONE,
        }
      ]
    }
  ];

  for (const cust of customersData) {
    const { orders, ...customerFields } = cust;
    await prisma.customer.create({
      data: {
        ...customerFields,
        orders: {
          create: orders,
        },
      },
    });
  }

  // Create an existing refund record for Scenario 4 (Already Refunded Order)
  await prisma.refund.create({
    data: {
      id: 'ref_401_existing',
      orderId: 'ord_401_already_refunded',
      customerId: 'cust_004_already_refunded',
      amount: 3499.00,
      status: RefundDecisionStatus.APPROVED,
      reason: 'Product defective on arrival - refund processed previously',
      processedAt: daysAgo(15),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📊 Summary: Created 15 Customers and 16 Orders covering all 7 test scenarios.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
