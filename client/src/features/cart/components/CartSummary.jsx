import React from 'react';
import { PackageCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

const formatPrice = (price = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export const CartSummary = ({ summary, hasUnavailableItems, onCheckout, isPending }) => {
  return (
    <Card className="md:sticky md:top-24 h-fit rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gray-900">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="space-y-4 border-b border-gray-100 pb-6">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({summary.itemCount} items)</span>
            <span className="font-medium text-gray-900">{formatPrice(summary.totalAmount)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-lg font-bold text-gray-900 my-6">
          <span>Total Amount</span>
          <span className="text-2xl">{formatPrice(summary.totalAmount)}</span>
        </div>
        <Button
          className="w-full py-4 shadow-lg shadow-primary-600/20"
          onClick={onCheckout}
          disabled={isPending || hasUnavailableItems}
        >
          {isPending ? (
            'Processing...'
          ) : (
            <>
              <PackageCheck className="w-5 h-5 mr-2" />
              Proceed to Checkout
            </>
          )}
        </Button>
        {hasUnavailableItems && (
          <p className="mt-4 text-xs font-semibold text-red-600 text-center bg-red-50 border border-red-100 p-2.5 rounded-xl">
            Remove unavailable items from your cart to proceed.
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Checkout
        </div>
      </CardContent>
    </Card>
  );
};
