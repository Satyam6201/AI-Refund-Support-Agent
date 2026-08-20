import { z } from 'zod';

export const CustomerTierSchema = z.enum(['VIP', 'REGULAR', 'NEW']);
export type CustomerTier = z.infer<typeof CustomerTierSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string(),
  tier: CustomerTierSchema,
  totalOrders: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Customer = z.infer<typeof CustomerSchema>;
