import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await CustomerService.getCustomerById(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: `Customer '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}
