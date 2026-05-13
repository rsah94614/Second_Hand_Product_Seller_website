import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';

export const EmptyCart = () => {
  return (
    <Card className="mx-auto max-w-2xl rounded-2xl border-gray-100 shadow-sm text-center animate-fade-in">
      <CardContent className="p-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Looks like you haven&apos;t added anything yet. Browse our products to find something you love!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center"
        >
          <Button className="px-8 py-3 shadow-lg shadow-primary-600/20">Start Shopping</Button>
        </Link>
      </CardContent>
    </Card>
  );
};
