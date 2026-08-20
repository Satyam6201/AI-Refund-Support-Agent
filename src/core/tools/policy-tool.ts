import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { CustomerService } from '@/services/customer.service';
import { OrderService } from '@/services/order.service';
import { RefundService } from '@/services/refund.service';
import { RefundPolicyEngine } from '@/core/policy/refund-policy';

export const checkRefundPolicySchema = z.object({
  customerId: z.string().min(1, 'customerId is required').describe('ID of the customer requesting the refund'),
  orderId: z.string().min(1, 'orderId is required').describe('ID of the order to validate for refund eligibility'),
});

export const checkRefundPolicyTool = tool(
  async (input) => {
    try {
      const { customerId, orderId } = input;

      const customer = await CustomerService.getCustomerById(customerId);
      const order = await OrderService.getOrderById(orderId);
      const existingRefund = order ? await RefundService.getRefundByOrderId(order.id) : null;

      const result = RefundPolicyEngine.validate({
        customer,
        order,
        existingRefund,
        requestedCustomerId: customerId,
      });

      return JSON.stringify({
        success: true,
        eligible: result.eligible,
        requiresHumanApproval: result.requiresHumanApproval,
        violations: result.violations,
        checks: result.checks,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || 'Failed to validate refund policy.',
      });
    }
  },
  {
    name: 'check_refund_policy',
    description: 'Validates an order against strict refund policy rules deterministically (30-day window, product condition, final sale, duplicate refund, customer ownership, amount threshold).',
    schema: checkRefundPolicySchema,
  }
);
