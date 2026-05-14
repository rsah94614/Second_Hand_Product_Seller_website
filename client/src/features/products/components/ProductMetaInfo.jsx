import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, MapPin, Calendar, Flag } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { getCampusPickupLabel } from '../../../lib/campus';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export const ProductMetaInfo = ({ product, isOwner, userRole, onDelete }) => {
  const daysRemaining = product.expiresAt 
    ? Math.ceil((new Date(product.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge className="border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 tracking-wide uppercase">
          {product.condition}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold tracking-wide uppercase">
          {product.category}
        </Badge>
        <div className="flex items-center text-xs font-bold text-gray-500 ml-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          <span>{getCampusPickupLabel(product.seller?.location)}</span>
        </div>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
          {product.title}
        </h1>
        {isOwner && (
          <div className="flex gap-2">
            <Link to={`/edit-product/${product._id}`}>
              <Button variant="outline" size="icon" title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-5xl font-black text-gray-900 mb-8 tracking-tight flex items-baseline gap-2">
        {formatPrice(product.price)}
      </p>

      {daysRemaining !== null && daysRemaining <= 10 && (
        <p className="text-sm font-bold text-orange-600 mb-6 flex items-center bg-orange-50 p-2 rounded-xl border border-orange-100 animate-pulse">
          <Calendar className="w-4 h-4 mr-2" />
          Urgent: This listing expires in {daysRemaining} days!
        </p>
      )}

      {product.flagged && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3 text-red-800 text-sm animate-fade-in">
          <Flag className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold mb-1">Safety Alert</p>
            <p>This listing has been flagged by our automated safety systems. Proceed with caution and only meet in public campus locations.</p>
            {userRole === 'admin' && (
              <p className="mt-2 text-xs opacity-75">Admin insight: Score {product.riskScore} - {product.flaggedReason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
