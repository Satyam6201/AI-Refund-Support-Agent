import { prisma } from '../src/lib/db';

async function verifyNeon() {
  console.log('🔌 Testing Neon PostgreSQL Connection...');
  try {
    const customers = await prisma.customer.findMany();
    const orders = await prisma.order.findMany();
    console.log(`✅ NEON DB CONNECTED SUCCESSFULLY!`);
    console.log(`📊 Found ${customers.length} Customers and ${orders.length} Orders in Neon PostgreSQL database.`);
  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeon();
