import { prisma } from '@/lib/db';
import { Refund } from '@/types/refund';
import { RefundDecisionStatus, RefundStatus } from '@prisma/client';

const MEMORY_REFUNDS: Refund[] = [];

export class RefundService {
  static async getRefundByOrderId(orderId: string): Promise<Refund | null> {
    try {
      const refund = await prisma.refund.findUnique({ where: { orderId } });
      if (refund) return refund;
    } catch (e) {
      console.warn('PostgreSQL offline, checking memory refund store.');
    }
    return MEMORY_REFUNDS.find((r) => r.orderId === orderId) || null;
  }

  static async createRefundRecord(params: {
    orderId: string;
    customerId: string;
    amount: number;
    reason: string;
    status: RefundDecisionStatus;
  }): Promise<Refund> {
    const { orderId, customerId, amount, reason, status } = params;

    const newRefund: Refund = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      customerId,
      amount,
      reason,
      status,
      processedAt: status === RefundDecisionStatus.APPROVED ? new Date() : null,
      createdAt: new Date(),
    };

    try {
      return await prisma.$transaction(async (tx) => {
        const refund = await tx.refund.create({
          data: {
            orderId,
            customerId,
            amount,
            reason,
            status,
            processedAt: status === RefundDecisionStatus.APPROVED ? new Date() : null,
          },
        });

        if (status === RefundDecisionStatus.APPROVED) {
          await tx.order.update({
            where: { id: orderId },
            data: { refundStatus: RefundStatus.REFUNDED },
          });
        }

        return refund;
      });
    } catch (e) {
      console.warn('PostgreSQL offline, storing refund record in memory.');
      MEMORY_REFUNDS.push(newRefund);
      return newRefund;
    }
  }
}
