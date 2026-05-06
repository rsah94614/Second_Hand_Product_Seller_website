import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const OrderEmptyState = () => {
  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm text-center animate-fade-in">
      <CardContent className="p-16">
        <div className="mx-auto h-24 w-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-primary-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          You haven&apos;t placed any orders on the campus marketplace yet. Start exploring useful student essentials!
        </p>
        <Link to="/products">
          <Button variant="primary" className="rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-primary-600/20">
            Browse Products
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
