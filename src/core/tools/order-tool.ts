import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { OrderService } from '@/services/order.service';

export const getOrderSchema = z.object({
  orderId: z.string().min(1, 'orderId is required').describe('Unique identifier of the order (e.g. ord_101_valid_within_policy)'),
});

export const getOrderTool = tool(
  async (input) => {
    try {
      const order = await OrderService.getOrderById(input.orderId);
      if (!order) {
        return JSON.stringify({ success: false, error: `Order with ID '${input.orderId}' not found.` });
      }
      return JSON.stringify({ success: true, order });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message || 'Failed to fetch order information.' });
    }
  },
  {
    name: 'get_order',
    description: 'Fetch order information from database using orderId.',
    schema: getOrderSchema,
  }
);
