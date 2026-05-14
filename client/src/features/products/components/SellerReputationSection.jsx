import React from 'react';
import { User, MapPin, Star, Mail } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { getCampusPickupLabel } from '../../../lib/campus';

const getTrustLabelColor = (colorStr) => {
  const map = {
    green: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-500/20 text-blue-700 border-blue-200',
    gray: 'bg-gray-500/20 text-gray-700 border-gray-200',
    emerald: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-500/20 text-amber-700 border-amber-200',
    purple: 'bg-purple-500/20 text-purple-700 border-purple-200',
  };
  return map[colorStr] || map.gray;
};

export const SellerReputationSection = ({ 
  seller, 
  sellerProfile, 
  isOwner, 
  reviews, 
  existingReview, 
  reviewForm, 
  setReviewForm, 
  onReviewSubmit, 
  isReviewPending 
}) => {
  return (
    <div className="space-y-8">
      {/* Seller Summary */}
      <div className="relative">
        <h3 className="text-xl font-black tracking-tight text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          Meet the Seller
        </h3>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-black text-2xl shrink-0">
            {seller?.name?.[0] || <User className="w-7 h-7" />}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">{seller?.name || 'Unknown Seller'}</p>
            <p className="text-gray-500 text-sm flex items-center mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
              {seller ? getCampusPickupLabel(seller.location) : 'Location unavailable'}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Star className="h-4 w-4 fill-current text-amber-500" />
              <span>
                {seller?.reviewCount
                  ? `${Number(seller.averageRating || 0).toFixed(1)} (${seller.reviewCount} review${seller.reviewCount === 1 ? '' : 's'})`
                  : 'No reviews yet'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {sellerProfile?.trustSignals?.trustLabels?.map(label => (
                <Badge key={label.key} className={`border outline-hidden whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white ${getTrustLabelColor(label.color)}`}>
                  {label.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {seller?.email && (
            <a href={`mailto:${seller.email}`} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors group bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              {seller.email}
            </a>
          )}
        </div>
      </div>

      {/* Full Reviews Section */}
      <div className="pt-8 mt-8 border-t border-gray-100">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Seller Reviews</h3>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              {seller?.reviewCount || 0} review{seller?.reviewCount === 1 ? '' : 's'} about this seller
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-amber-700">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-bold">{seller?.averageRating || 0}/5</span>
          </div>
        </div>

        {!isOwner && seller && (
          <form onSubmit={onReviewSubmit} className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <div className="mb-4">
              <p className="mb-2 text-sm font-bold text-gray-800 uppercase tracking-wider">
                {existingReview ? 'Update your review' : 'Rate this seller'}
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                    className="rounded-full p-1 text-amber-400 hover:text-amber-500 transition-transform hover:scale-110"
                  >
                    <Star className={`h-6 w-6 ${rating <= reviewForm.rating ? 'fill-current text-amber-500' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience trading with this user..."
              className="mb-4 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20"
              rows={3}
            />
            <Button type="submit" disabled={isReviewPending} className="w-full sm:w-auto rounded-xl font-bold">
              {isReviewPending ? 'Saving...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </form>
        )}

        {reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {review.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{review.user?.name || 'Anonymous'}</p>
                      <p className="text-xs font-medium text-gray-400">
                        {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                    <span className="text-xs font-bold">{review.rating}</span>
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 font-medium">
                  {review.comment || 'No written feedback provided.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500 font-medium bg-gray-50/50">
            No seller reviews yet. Be the first to share your experience!
          </div>
        )}
      </div>
    </div>
  );
};
