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
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
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

      <p className="text-4xl font-black text-primary-600 mb-4">
        {formatPrice(product.price)}
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Badge className="border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
          {product.condition}
        </Badge>
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
          {product.category}
        </Badge>
        <div className="flex items-center text-sm font-medium text-gray-600 ml-2">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
          <span>{getCampusPickupLabel(product.seller?.location)}</span>
        </div>
      </div>

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
