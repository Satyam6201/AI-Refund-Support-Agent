import { Customer } from '@/types/customer';
import { Order } from '@/types/order';
import { Refund } from '@/types/refund';
import { REFUND_POLICY_CONSTANTS } from './policy-constants';
import { PolicyCheckResult, PolicyValidationResult, PolicyViolationCode } from './policy-types';

export interface PolicyValidationInput {
  customer?: Customer | null;
  order?: Order | null;
  existingRefund?: Refund | null;
  requestedCustomerId?: string;
  requestedAmount?: number;
}

export class RefundPolicyEngine {
  public static validate(input: PolicyValidationInput): PolicyValidationResult {
    const checks: PolicyCheckResult[] = [];
    const violations: PolicyViolationCode[] = [];
    let requiresHumanApproval = false;

    const { customer, order, existingRefund, requestedCustomerId, requestedAmount } = input;

    const customerIdToMatch = requestedCustomerId || (customer ? customer.id : undefined);
    const hasValidCustomer = !!customer;
    const hasValidOrder = !!order;
    const isCustomerMatch = hasValidOrder && customerIdToMatch ? order.customerId === customerIdToMatch : false;

    if (!hasValidCustomer) {
      violations.push('CUSTOMER_NOT_FOUND');
      checks.push({
        rule: 'Valid Customer Account',
        passed: false,
        explanation: 'Customer account could not be found or verified.',
        code: 'CUSTOMER_NOT_FOUND',
      });
    } else {
      checks.push({
        rule: 'Valid Customer Account',
        passed: true,
        explanation: `Customer verified (${customer.name}, ${customer.email}).`,
      });
    }

    if (!hasValidOrder) {
      violations.push('ORDER_NOT_FOUND');
      checks.push({
        rule: 'Valid Order Identification',
        passed: false,
        explanation: 'Order record does not exist in the database.',
        code: 'ORDER_NOT_FOUND',
      });
    } else {
      checks.push({
        rule: 'Valid Order Identification',
        passed: true,
        explanation: `Order verified (${order.id}, Amount: ₹${order.amount}).`,
      });
    }

    if (hasValidOrder && customerIdToMatch && !isCustomerMatch) {
      violations.push('CUSTOMER_MISMATCH');
      checks.push({
        rule: 'Customer Order Ownership',
        passed: false,
        explanation: `Order ${order.id} does not belong to customer ${customerIdToMatch}.`,
        code: 'CUSTOMER_MISMATCH',
      });
    } else if (hasValidOrder && hasValidCustomer) {
      checks.push({
        rule: 'Customer Order Ownership',
        passed: true,
        explanation: `Order ${order.id} belongs to customer ${customer.name}.`,
      });
    }

    if (!order || !customer || !isCustomerMatch) {
      return {
        eligible: false,
        requiresHumanApproval: false,
        violations,
        checks,
      };
    }

    const deliveryTime = new Date(order.deliveryDate).getTime();
    const nowTime = new Date().getTime();
    const daysSinceDelivery = Math.floor((nowTime - deliveryTime) / (1000 * 60 * 60 * 24));
    const passed30Days = daysSinceDelivery <= REFUND_POLICY_CONSTANTS.MAX_REFUND_CALENDAR_DAYS;

    if (!passed30Days) {
      violations.push('DELIVERY_WINDOW_EXCEEDED');
      checks.push({
        rule: '30-Day Calendar Return Window',
        passed: false,
        explanation: `Order was delivered ${daysSinceDelivery} days ago, exceeding the ${REFUND_POLICY_CONSTANTS.MAX_REFUND_CALENDAR_DAYS}-day return window.`,
        code: 'DELIVERY_WINDOW_EXCEEDED',
      });
    } else {
      checks.push({
        rule: '30-Day Calendar Return Window',
        passed: true,
        explanation: `Delivered ${daysSinceDelivery} days ago (within ${REFUND_POLICY_CONSTANTS.MAX_REFUND_CALENDAR_DAYS}-day window).`,
      });
    }

    const isUsed = order.productCondition === 'USED';
    if (isUsed) {
      violations.push('PRODUCT_CONDITION_USED');
      checks.push({
        rule: 'Product Condition Standard',
        passed: false,
        explanation: 'Product condition is listed as USED. Used items are not eligible for standard return.',
        code: 'PRODUCT_CONDITION_USED',
      });
    } else {
      checks.push({
        rule: 'Product Condition Standard',
        passed: true,
        explanation: `Product condition is ${order.productCondition}.`,
      });
    }

    if (order.isFinalSale) {
      violations.push('FINAL_SALE_PRODUCT');
      checks.push({
        rule: 'Non-Final-Sale Item',
        passed: false,
        explanation: 'Item was purchased under Final Sale / Clearance terms and cannot be refunded.',
        code: 'FINAL_SALE_PRODUCT',
      });
    } else {
      checks.push({
        rule: 'Non-Final-Sale Item',
        passed: true,
        explanation: 'Item is not a final sale product.',
      });
    }

    const isAlreadyRefunded = order.refundStatus === 'REFUNDED' || !!existingRefund;
    if (isAlreadyRefunded) {
      violations.push('ALREADY_REFUNDED');
      checks.push({
        rule: 'Duplicate Refund Prevention',
        passed: false,
        explanation: 'Order has already been refunded.',
        code: 'ALREADY_REFUNDED',
      });
    } else {
      checks.push({
        rule: 'Duplicate Refund Prevention',
        passed: true,
        explanation: 'No prior refund processed for this order.',
      });
    }

    const targetAmount = requestedAmount ?? order.amount;
    if (targetAmount > order.amount) {
      violations.push('AMOUNT_EXCEEDS_ORDER');
      checks.push({
        rule: 'Refund Amount Limit',
        passed: false,
        explanation: `Requested refund amount (₹${targetAmount}) exceeds original order amount (₹${order.amount}).`,
        code: 'AMOUNT_EXCEEDS_ORDER',
      });
    } else {
      checks.push({
        rule: 'Refund Amount Limit',
        passed: true,
        explanation: `Refund amount (₹${targetAmount}) is within original order amount (₹${order.amount}).`,
      });
    }

    if (targetAmount > REFUND_POLICY_CONSTANTS.HIGH_VALUE_THRESHOLD_INR) {
      requiresHumanApproval = true;
      checks.push({
        rule: 'High Value Threshold Check',
        passed: true,
        explanation: `Refund amount (₹${targetAmount}) exceeds automatic threshold (₹${REFUND_POLICY_CONSTANTS.HIGH_VALUE_THRESHOLD_INR}). Human manager approval required.`,
        code: 'HIGH_VALUE_HUMAN_APPROVAL_REQUIRED',
      });
    } else {
      checks.push({
        rule: 'High Value Threshold Check',
        passed: true,
        explanation: `Refund amount (₹${targetAmount}) is within automatic processing limit (<= ₹${REFUND_POLICY_CONSTANTS.HIGH_VALUE_THRESHOLD_INR}).`,
      });
    }

    const eligible = violations.length === 0;

    return {
      eligible,
      requiresHumanApproval,
      violations,
      checks,
    };
  }
}
