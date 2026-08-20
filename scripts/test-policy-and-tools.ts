import { RefundPolicyEngine } from '../src/core/policy/refund-policy';
import { CustomerTier, ProductCategory, ProductCondition, RefundStatus } from '@prisma/client';

async function runTests() {
  console.log('🧪 Starting Deterministic Refund Policy Unit Tests...\n');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const mockCustomer = {
    id: 'cust_001_valid',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+919876543210',
    tier: CustomerTier.VIP,
    totalOrders: 5,
    createdAt: now,
    updatedAt: now,
  };

  // Test 1: Valid Refund Within Policy
  const test1Order = {
    id: 'ord_101_valid',
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
  };

  const res1 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test1Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 1 - Valid Refund Within Policy:');
  console.log(`  Eligible: ${res1.eligible} (Expected: true)`);
  console.log(`  Requires Human Approval: ${res1.requiresHumanApproval} (Expected: false)`);
  console.log(`  Violations: ${res1.violations.length} (Expected: 0)`);
  console.assert(res1.eligible === true, 'Test 1 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 2: Refund Outside 30 Days
  const test2Order = {
    ...test1Order,
    id: 'ord_201_expired',
    deliveryDate: daysAgo(45), // Delivered 45 days ago
  };

  const res2 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test2Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 2 - Refund Outside 30 Days:');
  console.log(`  Eligible: ${res2.eligible} (Expected: false)`);
  console.log(`  Violation Code: ${res2.violations.join(', ')} (Expected: DELIVERY_WINDOW_EXCEEDED)`);
  console.assert(res2.eligible === false && res2.violations.includes('DELIVERY_WINDOW_EXCEEDED'), 'Test 2 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 3: Final Sale Product
  const test3Order = {
    ...test1Order,
    id: 'ord_301_final_sale',
    isFinalSale: true,
  };

  const res3 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test3Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 3 - Final Sale Product:');
  console.log(`  Eligible: ${res3.eligible} (Expected: false)`);
  console.log(`  Violation Code: ${res3.violations.join(', ')} (Expected: FINAL_SALE_PRODUCT)`);
  console.assert(res3.eligible === false && res3.violations.includes('FINAL_SALE_PRODUCT'), 'Test 3 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 4: Already Refunded Order
  const test4Order = {
    ...test1Order,
    id: 'ord_401_already_refunded',
    refundStatus: RefundStatus.REFUNDED,
  };

  const res4 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test4Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 4 - Already Refunded Order:');
  console.log(`  Eligible: ${res4.eligible} (Expected: false)`);
  console.log(`  Violation Code: ${res4.violations.join(', ')} (Expected: ALREADY_REFUNDED)`);
  console.assert(res4.eligible === false && res4.violations.includes('ALREADY_REFUNDED'), 'Test 4 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 5: Used Product Condition
  const test5Order = {
    ...test1Order,
    id: 'ord_501_used',
    productCondition: ProductCondition.USED,
  };

  const res5 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test5Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 5 - Used Product:');
  console.log(`  Eligible: ${res5.eligible} (Expected: false)`);
  console.log(`  Violation Code: ${res5.violations.join(', ')} (Expected: PRODUCT_CONDITION_USED)`);
  console.assert(res5.eligible === false && res5.violations.includes('PRODUCT_CONDITION_USED'), 'Test 5 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 6: High Value Refund (> ₹10,000)
  const test6Order = {
    ...test1Order,
    id: 'ord_601_high_value',
    amount: 25000.00, // ₹25,000
  };

  const res6 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test6Order,
    requestedCustomerId: 'cust_001_valid',
  });

  console.log('Test 6 - High Value Refund (> ₹10,000):');
  console.log(`  Eligible: ${res6.eligible} (Expected: true)`);
  console.log(`  Requires Human Approval: ${res6.requiresHumanApproval} (Expected: true)`);
  console.assert(res6.eligible === true && res6.requiresHumanApproval === true, 'Test 6 Failed!');
  console.log('  ✅ Passed!\n');

  // Test 7: Customer Mismatch Security Check
  const res7 = RefundPolicyEngine.validate({
    customer: mockCustomer,
    order: test1Order,
    requestedCustomerId: 'cust_999_attacker',
  });

  console.log('Test 7 - Customer Order Ownership Mismatch:');
  console.log(`  Eligible: ${res7.eligible} (Expected: false)`);
  console.log(`  Violation Code: ${res7.violations.join(', ')} (Expected: CUSTOMER_MISMATCH)`);
  console.assert(res7.eligible === false && res7.violations.includes('CUSTOMER_MISMATCH'), 'Test 7 Failed!');
  console.log('  ✅ Passed!\n');

  console.log('🎉 ALL 7 DETERMINISTIC REFUND POLICY UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
