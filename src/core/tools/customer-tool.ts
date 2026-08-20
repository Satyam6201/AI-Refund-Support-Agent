import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { CustomerService } from '@/services/customer.service';

export const getCustomerSchema = z.object({
  customerId: z.string().nullable().optional().describe('Unique ID of the customer (e.g. cust_001_valid)'),
  email: z.string().email().nullable().optional().describe('Email address of the customer (e.g. aarav.sharma@example.com)'),
}).refine(data => data.customerId || data.email, {
  message: 'Either customerId or email must be provided to look up a customer profile.',
});

export const getCustomerTool = tool(
  async (input) => {
    try {
      if (input.customerId) {
        const customer = await CustomerService.getCustomerById(input.customerId);
        if (!customer) {
          return JSON.stringify({ success: false, error: `Customer with ID '${input.customerId}' not found.` });
        }
        return JSON.stringify({ success: true, customer });
      }

      if (input.email) {
        const customer = await CustomerService.getCustomerByEmail(input.email);
        if (!customer) {
          return JSON.stringify({ success: false, error: `Customer with email '${input.email}' not found.` });
        }
        return JSON.stringify({ success: true, customer });
      }

      return JSON.stringify({ success: false, error: 'Invalid search parameters.' });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message || 'Failed to fetch customer profile.' });
    }
  },
  {
    name: 'get_customer',
    description: 'Look up customer profile information from CRM database by customerId or email.',
    schema: getCustomerSchema,
  }
);
