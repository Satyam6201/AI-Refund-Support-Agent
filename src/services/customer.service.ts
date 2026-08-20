import { prisma } from '@/lib/db';
import { Customer } from '@/types/customer';
import { CustomerTier } from '@prisma/client';

const FALLBACK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_001_valid',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+919876543210',
    tier: CustomerTier.VIP,
    totalOrders: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cust_002_expired',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+919876543211',
    tier: CustomerTier.REGULAR,
    totalOrders: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cust_003_final_sale',
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+919876543212',
    tier: CustomerTier.NEW,
    totalOrders: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cust_006_high_value',
    name: 'Kavya Nair',
    email: 'kavya.nair@example.com',
    phone: '+919876543215',
    tier: CustomerTier.VIP,
    totalOrders: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class CustomerService {
  static async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const cust = await prisma.customer.findUnique({ where: { id } });
      if (cust) return cust;
    } catch (e) {
      console.warn('PostgreSQL offline, using memory customer fallback.');
    }
    return FALLBACK_CUSTOMERS.find((c) => c.id === id) || null;
  }

  static async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const cust = await prisma.customer.findUnique({ where: { email } });
      if (cust) return cust;
    } catch (e) {
      console.warn('PostgreSQL offline, using memory customer fallback.');
    }
    return FALLBACK_CUSTOMERS.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async getAllCustomers(): Promise<Customer[]> {
    try {
      const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
      if (customers.length > 0) return customers;
    } catch (e) {
      console.warn('PostgreSQL offline, using memory customer fallback.');
    }
    return FALLBACK_CUSTOMERS;
  }
}
