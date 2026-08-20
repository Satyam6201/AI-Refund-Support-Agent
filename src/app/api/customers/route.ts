import { NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';

export async function GET() {
  try {
    const customers = await CustomerService.getAllCustomers();
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
