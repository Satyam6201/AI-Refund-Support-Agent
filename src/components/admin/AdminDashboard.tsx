'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ShoppingBag, ShieldAlert, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">CRM Customers</p>
              <p className="text-2xl font-bold">15</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Seed Orders</p>
              <p className="text-2xl font-bold">16</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-lg">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Policy Test Scenarios</p>
              <p className="text-2xl font-bold">7</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">System Status</p>
              <Badge variant="success">Ready</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed Policy Test Scenarios Overview</CardTitle>
          <CardDescription>Configured test records in PostgreSQL database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">1. Valid Refund Within Policy</span>
                <p className="text-xs text-slate-500">Aarav Sharma - Order ord_101_valid_within_policy (₹4,999, Unopened, 10 days old)</p>
              </div>
              <Badge variant="success">Eligible</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">2. Refund Outside 30 Days</span>
                <p className="text-xs text-slate-500">Priya Patel - Order ord_201_outside_30_days (Delivered 45 days ago)</p>
              </div>
              <Badge variant="danger">Expired Window</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">3. Final Sale Product</span>
                <p className="text-xs text-slate-500">Rohan Verma - Order ord_301_final_sale (isFinalSale: true)</p>
              </div>
              <Badge variant="danger">Final Sale</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">4. Already Refunded Order</span>
                <p className="text-xs text-slate-500">Ananya Iyer - Order ord_401_already_refunded (Status: REFUNDED)</p>
              </div>
              <Badge variant="warning">Duplicate</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">5. Used Product</span>
                <p className="text-xs text-slate-500">Vikram Singh - Order ord_501_used_product (Condition: USED)</p>
              </div>
              <Badge variant="danger">Condition Violation</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">6. High Value Refund (&gt; ₹10,000)</span>
                <p className="text-xs text-slate-500">Kavya Nair - Order ord_601_above_10k (₹24,999)</p>
              </div>
              <Badge variant="warning">Escalation Required</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">7. Valid Refund for Another Customer</span>
                <p className="text-xs text-slate-500">Aditya Gupta - Order ord_701_valid_customer_2 (₹1,850)</p>
              </div>
              <Badge variant="success">Eligible</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
