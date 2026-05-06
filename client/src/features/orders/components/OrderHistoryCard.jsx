import React from 'react';
import { Clock, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { formatCampusAddress } from '../../../lib/campus';
import { OrderActionButtons } from './OrderActionButtons';

const statusStyles = {
  requested:        'bg-yellow-100 text-yellow-700',
  accepted:         'bg-blue-100 text-blue-700',
  meetup_scheduled: 'bg-indigo-100 text-indigo-700',
  delivered:        'bg-teal-100 text-teal-700',
  completed:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
  no_show:          'bg-orange-100 text-orange-700',
};

const formatPrice = (price = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const OrderHistoryCard = ({ order, user, actions }) => {
  const shippingAddress = formatCampusAddress(order.shippingDetails);

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-in overflow-hidden">
      <CardContent className="p-0">
        {/* Card Header */}
        <div className="bg-gray-50/50 p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                <p className="text-sm font-black text-gray-900">
                  #{order._id.slice(-6).toUpperCase()}
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {formatDate(order.createdAt || order.placedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-xl font-black text-primary-600">
                <IndianRupee className="w-5 h-5 mr-0.5" />
                {formatPrice(order.total).replace('₹', '')}
              </div>
              <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-tight ${statusStyles[order.status] || statusStyles.requested}`}>
                {order.status?.replace(/_/g, ' ')}
              </Badge>
              <OrderActionButtons 
                order={order} 
                user={user} 
                {...actions} 
              />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={`${order._id}-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={item.image || PRODUCT_FALLBACK_IMAGE}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  onError={setFallbackImage}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {item.title}
                    {item.quantity > 1 && (
                      <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        x{item.quantity}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Last update: {formatDate(order.updatedAt || order.createdAt)}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Item Total</p>
                  <p className="text-lg font-black text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {order.shippingDetails?.fullName && (
            <div className="bg-gray-50/80 border border-gray-100 p-5 rounded-2xl text-sm">
              <p className="font-black text-gray-900 uppercase tracking-widest text-[10px] mb-3">
                Delivery / Meetup Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-gray-800">{order.shippingDetails.fullName}</p>
                  <p className="text-gray-600 mt-1">{shippingAddress.primaryLine}</p>
                  <p className="text-gray-600">{shippingAddress.secondaryLine}</p>
                </div>
                {order.seller?.name && (
                  <div className="md:text-right">
                    <p className="text-gray-500">Seller</p>
                    <p className="font-bold text-gray-800">{order.seller.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
