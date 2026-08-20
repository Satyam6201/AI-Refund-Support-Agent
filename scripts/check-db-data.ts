import { prisma } from '../src/lib/db';

async function checkDatabaseData() {
  console.log('================ LIVE DATABASE STORAGE INSPECTION ================');
  console.log(`Connecting to Neon PostgreSQL database...\n`);

  try {
    // 1. Query Customers
    const customerCount = await prisma.customer.count();
    const sampleCustomers = await prisma.customer.findMany({ take: 3 });

    console.log(`1. CUSTOMER TABLE: ${customerCount} records found`);
    sampleCustomers.forEach((c) => {
      console.log(`   - [${c.id}] ${c.name} (${c.email}) | Tier: ${c.tier}`);
    });
    console.log('');

    // 2. Query Orders
    const orderCount = await prisma.order.count();
    const sampleOrders = await prisma.order.findMany({ take: 3, include: { customer: true } });

    console.log(`2. ORDER TABLE: ${orderCount} records found`);
    sampleOrders.forEach((o) => {
      console.log(`   - [${o.id}] Amount: ₹${o.amount} | Category: ${o.productCategory} | Condition: ${o.productCondition} | Refund Status: ${o.refundStatus}`);
    });
    console.log('');

    // 3. Query Refunds
    const refundCount = await prisma.refund.count();
    const sampleRefunds = await prisma.refund.findMany({ take: 5, include: { order: true, customer: true } });

    console.log(`3. REFUND TABLE: ${refundCount} refund records found`);
    if (refundCount === 0) {
      console.log('   (No refunds processed yet. Submit a valid refund request in /chat to process one!)');
    } else {
      sampleRefunds.forEach((r) => {
        console.log(`   - [${r.id}] Order: ${r.orderId} | Customer: ${r.customer.name} | Amount: ₹${r.amount} | Status: ${r.status}`);
      });
    }
    console.log('');

    // 4. Query Agent Executions & Step Logs
    const executionCount = await prisma.agentExecution.count();
    const logCount = await prisma.agentLog.count();
    const latestExecutions = await prisma.agentExecution.findMany({
      take: 3,
      orderBy: { startedAt: 'desc' },
      include: { logs: true },
    });

    console.log(`4. AGENT EXECUTION SESSION TABLE: ${executionCount} executions recorded`);
    console.log(`5. AGENT LOG STEP TRACE TABLE: ${logCount} log events recorded`);
    if (executionCount > 0) {
      console.log('\n   Latest Recorded Agent Executions:');
      latestExecutions.forEach((exec) => {
        console.log(`   - Session [${exec.id}] Status: ${exec.status}`);
        console.log(`     User Query: "${exec.userMessage}"`);
        console.log(`     Step Logs Count: ${exec.logs.length} step trace events`);
      });
    }

    console.log('\n==================================================================');
  } catch (error: any) {
    console.error('❌ Database inspection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();
