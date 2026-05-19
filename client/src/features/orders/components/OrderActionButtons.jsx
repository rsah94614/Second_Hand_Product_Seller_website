import React from 'react';
import { X, CheckCircle, AlertTriangle, Camera, Flag, Star, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const OrderActionButtons = ({ 
  order, 
  user, 
  onAccept,
  onCancel, 
  onSchedule,
  onDeliver, 
  onComplete, 
  onNoShow, 
  onPhotoUpload, 
  onDispute, 
  onReview,
  onMessage,
  isMutating 
}) => {
  const isSeller = order.seller?._id === user?.id || order.seller === user?.id;
  const isBuyer = order.user?._id === user?.id || order.user === user?.id;
  const canReview = order.reviewUnlocked === true && isBuyer;

  return (
    <div className="mt-3 md:mt-0 flex flex-wrap items-center gap-2">
      {/* Message button - available to both parties */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMessage(order)}
        disabled={isMutating}
        className="text-primary-600 border-primary-200 hover:bg-primary-50"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {isBuyer ? 'Message Seller' : 'Message Buyer'}
      </Button>

      {/* Accept button - for seller when requested */}
      {order.status === 'requested' && isSeller && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAccept(order._id)}
          disabled={isMutating}
          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept Order
        </Button>
      )}

      {/* Schedule Meetup button - for both when accepted */}
      {order.status === 'accepted' && (isBuyer || isSeller) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSchedule(order._id)}
          disabled={isMutating}
          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
        >
          <Calendar className="w-4 h-4 mr-1" />
          Schedule Meetup
        </Button>
      )}

      {/* Cancel button - available to both in early stages */}
      {(order.status === 'requested' || order.status === 'accepted') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCancel(order._id)}
          disabled={isMutating}
          className="text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      )}

      {/* Seller: Handed Over button */}
      {['accepted', 'meetup_scheduled'].includes(order.status) && isSeller && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeliver(order._id)}
          disabled={isMutating}
          className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Item Handed Over
        </Button>
      )}

      {/* Buyer: Confirm Receipt button */}
      {['meetup_scheduled', 'accepted', 'delivered'].includes(order.status) && isBuyer && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onComplete(order._id)}
          disabled={isMutating}
          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Confirm Receipt
        </Button>
      )}

      {/* No-Show reporting */}
      {order.status === 'meetup_scheduled' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNoShow(order._id)}
          disabled={isMutating}
          className="text-orange-600 hover:bg-orange-50 hover:border-orange-200"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          No-Show
        </Button>
      )}

      {/* Confirmation photo for completed orders */}
      {order.status === 'completed' && !order.confirmationPhoto?.url && (
        <label className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            asChild
          >
            <span>
              <Camera className="w-4 h-4 mr-1" />
              Add Photo
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotoUpload(order._id, e.target.files?.[0])}
          />
        </label>
      )}

      {/* Dispute button */}
      {['completed', 'no_show', 'meetup_scheduled'].includes(order.status) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDispute(order._id)}
          disabled={isMutating}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Flag className="w-4 h-4 mr-1" />
          Dispute
        </Button>
      )}

      {/* Review Seller button */}
      {canReview && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReview(order)}
          disabled={isMutating}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
          Rate Seller
        </Button>
      )}
    </div>
  );
};
