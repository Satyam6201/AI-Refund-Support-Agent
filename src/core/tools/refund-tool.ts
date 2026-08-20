import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { CustomerService } from '@/services/customer.service';
import { OrderService } from '@/services/order.service';
import { RefundService } from '@/services/refund.service';
import { RefundPolicyEngine } from '@/core/policy/refund-policy';
import { RefundDecisionStatus } from '@prisma/client';

export const processRefundSchema = z.object({
  customerId: z.string().min(1, 'customerId is required').describe('ID of the customer'),
  orderId: z.string().min(1, 'orderId is required').describe('ID of the order to process refund for'),
  reason: z.string().min(5, 'A valid detailed reason is required for processing the refund').describe('Reason for refund request'),
  simulateError: z.boolean().nullable().optional().describe('Developer flag to simulate transient tool failure for testing retries'),
});

export const processRefundTool = tool(
  async (input) => {
    try {
      const { customerId, orderId, reason, simulateError } = input;

      // Developer simulation mode for testing retries
      if (simulateError) {
        throw new Error('Simulated transient tool failure for demonstration.');
      }

      // =========================================================================
      // INDEPENDENT SECURITY DOUBLE-CHECK VALIDATION
      // =========================================================================

      // 1. Verify Customer Exists
      const customer = await CustomerService.getCustomerById(customerId);
      if (!customer) {
        return JSON.stringify({
          success: false,
          processed: false,
          error: `Security Rejection: Customer '${customerId}' does not exist.`,
        });
      }

      // 2. Verify Order Exists
      const order = await OrderService.getOrderById(orderId);
      if (!order) {
        return JSON.stringify({
          success: false,
          processed: false,
          error: `Security Rejection: Order '${orderId}' does not exist.`,
        });
      }

      // 3. Verify Order Belongs to Customer
      if (order.customerId !== customerId) {
        return JSON.stringify({
          success: false,
          processed: false,
          error: `Security Rejection: Order '${orderId}' does not belong to customer '${customerId}'.`,
        });
      }

      // 4. IDEMPOTENCY CHECK: If already processed, return existing refund safely
      const existingRefund = await RefundService.getRefundByOrderId(orderId);
      if (existingRefund || order.refundStatus === 'REFUNDED') {
        return JSON.stringify({
          success: true,
          processed: true,
          alreadyProcessed: true,
          status: existingRefund ? existingRefund.status : RefundDecisionStatus.APPROVED,
          refund: existingRefund,
          message: `Order '${orderId}' was already refunded previously. Returned existing refund record safely without duplicate transaction.`,
        });
      }

      // 5. Run Deterministic Policy Engine Check
      const policyResult = RefundPolicyEngine.validate({
        customer,
        order,
        existingRefund,
        requestedCustomerId: customerId,
      });

      if (!policyResult.eligible) {
        return JSON.stringify({
          success: false,
          processed: false,
          error: `Policy Rejection: Refund validation failed. Violations: ${policyResult.violations.join(', ')}`,
          policyResult,
        });
      }

      // 6. Determine Refund Status (APPROVED vs PENDING for > ₹10,000 High Value)
      const finalStatus = policyResult.requiresHumanApproval
        ? RefundDecisionStatus.PENDING
        : RefundDecisionStatus.APPROVED;

      // 7. Execute Database Transaction via RefundService
      const refundRecord = await RefundService.createRefundRecord({
        orderId,
        customerId,
        amount: order.amount,
        reason,
        status: finalStatus,
      });

      return JSON.stringify({
        success: true,
        processed: true,
        alreadyProcessed: false,
        status: finalStatus,
        requiresHumanApproval: policyResult.requiresHumanApproval,
        refund: refundRecord,
        message: policyResult.requiresHumanApproval
          ? `Refund request submitted for manager approval (Order amount ₹${order.amount} > ₹10,000 limit).`
          : `Refund of ₹${order.amount} processed successfully for order ${orderId}.`,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        processed: false,
        error: error.message || 'Fatal error while executing process_refund tool.',
      });
    }
  },
  {
    name: 'process_refund',
    description: 'Processes a refund transaction in the database safely and idempotently.',
    schema: processRefundSchema,
  }
);
