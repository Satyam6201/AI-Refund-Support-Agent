import { z } from 'zod';

export const ProductCategorySchema = z.enum(['ELECTRONICS', 'CLOTHING', 'HOME', 'BOOKS', 'SOFTWARE']);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductConditionSchema = z.enum(['UNOPENED', 'OPENED', 'USED', 'DAMAGED', 'DEFECTIVE']);
export type ProductCondition = z.infer<typeof ProductConditionSchema>;

export const RefundStatusSchema = z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'REFUNDED']);
export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  productCategory: ProductCategorySchema,
  amount: z.number().positive(),
  orderDate: z.date(),
  deliveryDate: z.date(),
  productCondition: ProductConditionSchema,
  isFinalSale: z.boolean(),
  refundStatus: RefundStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;
