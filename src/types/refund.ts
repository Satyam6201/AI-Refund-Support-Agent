import { z } from 'zod';

export const RefundDecisionStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type RefundDecisionStatus = z.infer<typeof RefundDecisionStatusSchema>;

export const RefundSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  amount: z.number().positive(),
  status: RefundDecisionStatusSchema,
  reason: z.string().min(1, 'Reason is required'),
  processedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type Refund = z.infer<typeof RefundSchema>;

export const RefundRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  condition: z.enum(['UNOPENED', 'OPENED', 'USED', 'DAMAGED', 'DEFECTIVE']),
});

export type RefundRequest = z.infer<typeof RefundRequestSchema>;
